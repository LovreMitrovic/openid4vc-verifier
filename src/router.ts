import express from 'express';
import {RP, SupportedVersion} from "@sphereon/did-auth-siop";
import QRCode from "qrcode";

const router = express.Router();

router.get('/', (req, res) => {
    res.render('index')
})

router.get('/example-presentation', async (req,res) => {
    const rp = req.app.locals.rp as RP;
    const url = req.app.locals.url;
    const authReq = await rp.createAuthorizationRequest({
        correlationId: 'corr-id',
        nonce: 'nonce',
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
    res.render('example',{authReqUri, qrCodeDataUri});
})

router.get('/ref', async (req, res) => {
    const rp = req.app.locals.rp as RP;
    const url = req.app.locals.url;
    // ako ga nema baci 404
    const authReq = req.app.locals.myAuthReq;
    res.send(await authReq.requestObject.toJwt());
    //res.send(authReq.requestObject.payload)
})

router.post('/post', async (req,res) => {
    const rp = req.app.locals.rp as RP;
    const authRes = req.body;
    const verifiedAuthRes = await rp.verifyAuthorizationResponse(authRes);
    console.log('/post req',authRes);
    if(verifiedAuthRes.nonce == "nonce" &&
        verifiedAuthRes.state == "state"){
        console.log(verifiedAuthRes.authorizationResponse.payload)
        res.sendStatus(200)
    }

    res.sendStatus(400);
})
export default router;