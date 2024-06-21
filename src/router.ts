import express from 'express';
import {RP, SupportedVersion, AuthorizationResponsePayload} from "@sphereon/did-auth-siop";
import QRCode from "qrcode";
import { presentationDefinition } from "./verifier"
import {PresentationDefinitionLocation} from "@sphereon/did-auth-siop/dist/authorization-response/types";
import {decodeJwt} from "jose";
import {randomBytes} from "node:crypto";
import {CapabilityUrlsManger} from "./CapabilityUrlsManger";

const router = express.Router();

router.post('/create-presentation', async (req,res) => {
    const rp = req.app.locals.rp as RP;
    const url = req.app.locals.url;
    const capabilityUrlsManager = req.app.locals.capabilityUrlsManager as CapabilityUrlsManger<string>;
    const correlationId: string = randomBytes(32).toString("hex");
    const nonce: string = randomBytes(32).toString("hex");
    const state: string = randomBytes(32).toString("hex");
    const reference: string = randomBytes(32).toString("hex");
    capabilityUrlsManager.set(reference, correlationId);
    const authReq = await rp.createAuthorizationRequest({
        correlationId, // if there is no corrId it uses state as corrId
        nonce,
        state,
        responseURI: `${url}/post`,
        responseURIType: "response_uri",
        version: SupportedVersion.JWT_VC_PRESENTATION_PROFILE_v1,
        requestByReferenceURI: `${url}/auth-req/${reference}`
    });
    const authReqUri = (await authReq.uri()).encodedUri;
    const qrCodeDataUri = await QRCode.toDataURL(authReqUri);

    console.log(authReq)
    res.render('example.ejs',{authReqUri, qrCodeDataUri, correlationId});
})

//this url should expire and aybe use something else instead of corrId https://www.rfc-editor.org/rfc/rfc9101.html
/*
    This url needs to be capability url. Look up
    https://www.rfc-editor.org/rfc/rfc9101.html#name-uri-referencing-the-request and
    https://www.rfc-editor.org/rfc/rfc6819#section-5.1.4.2.2 and
    https://www.w3.org/TR/capability-urls/
 */
router.get('/auth-req/:reference', async (req, res) => {
    const rp = req.app.locals.rp as RP;
    const capabilityUrlsManager = req.app.locals.capabilityUrlsManager as CapabilityUrlsManger<string>;
    const reference = req.params.reference;

    const correlationId = capabilityUrlsManager.get(reference);
    if(correlationId === null){
        res.sendStatus(404);
        return;
    }

    const authReq = await rp.sessionManager.getRequestStateByCorrelationId(correlationId);
    res.send(await authReq.request.requestObject.toJwt());
})

router.post('/post', async (req,res) => {
    const rp = req.app.locals.rp as RP;
    const url = req.app.locals.url;
    const authRes = req.body as AuthorizationResponsePayload;
    console.log(authRes)
    try {
        const verifiedAuthRes = await rp.verifyAuthorizationResponse(authRes, {
            //correlationId: 'corr-id',
            //state: "state",
            //nonce: "nonce",
            presentationDefinitions: [{
                definition: presentationDefinition,
                location: PresentationDefinitionLocation.CLAIMS_VP_TOKEN
            }]
        });
        console.log('Presented', verifiedAuthRes.authorizationResponse.payload)
        //TODO error cases, check what to do if token expired
    } catch (e){
        console.error(`Error while posting presentation ${e}`);
    }

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
    const vpToken = authResState.response.payload.vp_token.toString();
    const vpTokenPayload = decodeJwt(vpToken);
    const idToken = authResState.response.payload.id_token.toString();
    const idTokenPayload= decodeJwt(idToken);
    const credential = decodeJwt(vpTokenPayload['vp']['verifiableCredential'][0])

    if(authResState.status !== 'verified'){
        res.json(authResState)
        return;
    }

    const data = {
        nbf: credential.nbf,
        exp: credential.exp,
        manufacturer: credential['vc']['credentialSubject']['manufacturer']
    }
    res.json({...authResState, data, vpTokenPayload, vpToken, idTokenPayload, idToken})
})
export default router;