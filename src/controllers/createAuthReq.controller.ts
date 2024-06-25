import {RP, SupportedVersion} from "@sphereon/did-auth-siop";
import {CapabilityUrlsManager} from "../utils/CapabilityUrlsManager";
import {randomBytes} from "node:crypto";
import QRCode from "qrcode";

export const createAuthReq = async (req, res) => {
    const rp = req.app.locals.rp as RP;
    const url = req.app.locals.url;
    const capabilityUrlsManager = req.app.locals.capabilityUrlsManager as CapabilityUrlsManager<string>;
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
}