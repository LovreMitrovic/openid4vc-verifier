import {RP} from "@sphereon/did-auth-siop";
import {decodeJwt} from "jose";

export const authStatus = async (req,res) => {
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
}