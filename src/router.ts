import express from 'express';
import {RP, SupportedVersion, AuthorizationResponsePayload} from "@sphereon/did-auth-siop";
import QRCode from "qrcode";
import { presentationDefinition } from "./verifier"
import {PresentationDefinitionLocation} from "@sphereon/did-auth-siop/dist/authorization-response/types";
import {decodeJwt} from "jose";

const router = express.Router();

router.get('/', (req, res) => {
    res.render('index')
})

router.get('/example-presentation', async (req,res) => {
    const rp = req.app.locals.rp as RP;
    const url = req.app.locals.url;
    const correlationId = 'corr-id';
    const authReq = await rp.createAuthorizationRequest({
        correlationId, // if there is no corrId it uses state as corrId
        nonce: 'nonce',//todo can omit it will be provided automatically
        state: 'state',
        responseURI: `${url}/post`,
        responseURIType: "response_uri",
        version: SupportedVersion.JWT_VC_PRESENTATION_PROFILE_v1,
        //requestByReferenceURI: `${url}/def`
    });
    req.app.locals.myAuthReq = authReq;
    const authReqUri = (await authReq.uri()).encodedUri;
    const qrCodeDataUri = await QRCode.toDataURL(authReqUri);

    console.log(authReq)
    res.render('example',{authReqUri, qrCodeDataUri, correlationId});
})

router.get('/ref', async (req, res) => {
    const rp = req.app.locals.rp as RP;
    const url = req.app.locals.url;
    //todo ako ga nema baci 404
    const authReq = req.app.locals.myAuthReq;
    res.send(await authReq.requestObject.toJwt());
    //res.send(authReq.requestObject.payload)
})

router.post('/', async (req,res) => {
    const rp = req.app.locals.rp as RP;
    const url = req.app.locals.url;
    const authRes = req.body as AuthorizationResponsePayload;
    console.log(authRes)
    const verifiedAuthRes = await rp.verifyAuthorizationResponse(authRes, {
        correlationId: 'corr-id',
        state: "state",
        nonce: "nonce",
        presentationDefinitions: [{
            definition: presentationDefinition,
            location: PresentationDefinitionLocation.CLAIMS_VP_TOKEN
        }]
    });
    //console.log('/post req',authRes);
    console.log('Presented',verifiedAuthRes.authorizationResponse.payload)
    //TODO error cases, check what to do if token expired

    //todo check this again
    await rp.signalAuthRequestRetrieved({correlationId:'corr-id'});
    res.sendStatus(200);
})

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