import {RP} from "@sphereon/did-auth-siop";
import {CapabilityUrlsManager} from "../utils/CapabilityUrlsManager";

export const authRequest = async (req, res) => {
    const rp = req.app.locals.rp as RP;
    const capabilityUrlsManager = req.app.locals.capabilityUrlsManager as CapabilityUrlsManager<string>;
    const reference = req.params.reference;

    const correlationId = capabilityUrlsManager.get(reference);
    if(correlationId === null){
        res.sendStatus(404);
        return;
    }

    const authReq = await rp.sessionManager.getRequestStateByCorrelationId(correlationId);
    res.send(await authReq.request.requestObject.toJwt());
}