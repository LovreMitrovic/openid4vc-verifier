import express from 'express';
import {RP, SupportedVersion, AuthorizationResponsePayload} from "@sphereon/did-auth-siop";
import QRCode from "qrcode";
import { presentationDefinition } from "./verifier"
import {PresentationDefinitionLocation} from "@sphereon/did-auth-siop/dist/authorization-response/types";
import {decodeJwt} from "jose";
import {randomBytes} from "node:crypto";

const router = express.Router();

router.get('/', (req, res) => {
    res.render('index')
})

router.post('/create-presentation', async (req,res) => {
    const rp = req.app.locals.rp as RP;
    const url = req.app.locals.url;
    const correlationId: string = randomBytes(32).toString("hex");
    const nonce: string = randomBytes(32).toString("hex");
    const state: string = randomBytes(32).toString("hex");
    const authReq = await rp.createAuthorizationRequest({
        correlationId, // if there is no corrId it uses state as corrId
        nonce,//todo can omit it will be provided automatically
        state,
        responseURI: `${url}/post`,
        responseURIType: "response_uri",
        version: SupportedVersion.JWT_VC_PRESENTATION_PROFILE_v1,
        requestByReferenceURI: `${url}/auth-req?correlationId=${correlationId}`
    });
    const authReqUri = (await authReq.uri()).encodedUri;
    const qrCodeDataUri = await QRCode.toDataURL(authReqUri);

    console.log(authReq)
    res.render('example',{authReqUri, qrCodeDataUri, correlationId});
})

router.get('/auth-req', async (req, res) => {
    const rp = req.app.locals.rp as RP;
    if(!("correlationId" in req.query)){
        res.sendStatus(400);
        return;
    }
    const correlationId = req.query["correlationId"].toString();
    const authReq = await rp.sessionManager.getRequestStateByCorrelationId(correlationId);
    if(authReq === undefined){
        res.sendStatus(404);
        return;
    }
    res.send(await authReq.request.requestObject.toJwt());
})

router.post('/post', async (req,res) => {
    const rp = req.app.locals.rp as RP;
    const url = req.app.locals.url;
    const authRes = req.body as AuthorizationResponsePayload;
    console.log(authRes)
    const verifiedAuthRes = await rp.verifyAuthorizationResponse(authRes, {
        //correlationId: 'corr-id',
        //state: "state",
        //nonce: "nonce",
        presentationDefinitions: [{
            definition: presentationDefinition,
            location: PresentationDefinitionLocation.CLAIMS_VP_TOKEN
        }]
    });
    console.log('Presented',verifiedAuthRes.authorizationResponse.payload)
    //TODO error cases, check what to do if token expired

    //todo check this again
    //await rp.signalAuthRequestRetrieved({correlationId:'corr-id'});
    /*
        If the Response Endpoint has successfully processed the Authorization Response or
        Authorization Error Response, it MUST respond with HTTP status code 200.
        https://openid.github.io/OpenID4VP/openid-4-verifiable-presentations-wg-draft.html#section-6.2-17
     */
    res.sendStatus(200);
})

/*
    Out od scope of specification of protocol OID4VP
 */
router.post('/auth-status', async (req,res) => {
    const rp = req.app.locals.rp as RP;
    const { correlationId } = req.body;
    const authReqState = await rp.sessionManager.getRequestStateByCorrelationId(correlationId);
    if(authReqState === undefined){
        res.sendStatus(404);
        return;
    }
    const authResState = await rp.sessionManager.getResponseStateByCorrelationId(correlationId);
    if(authResState == undefined){
        res.json(authReqState);
        return;
    }

    //app specific
    const vpToken = decodeJwt(authResState.response.payload.vp_token.toString());
    const idToken= decodeJwt(authResState.response.payload.id_token.toString());
    const credential = decodeJwt(vpToken['vp']['verifiableCredential'][0])

    if(authResState.status !== 'verified'){
        res.json(authResState)
        return;
    }

    const data = {
        iat: credential.iat,
        exp: credential.exp,
        manufacturer: credential['vc']['credentialSubject']['manufacturer']
    }
    res.json({...authResState, data})
})
export default router;