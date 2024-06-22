import {AuthorizationResponsePayload, RP} from "@sphereon/did-auth-siop";
import {presentationDefinition} from "../services/verifier";
import {PresentationDefinitionLocation} from "@sphereon/did-auth-siop/dist/authorization-response/types";

export const submitPresentation = async (req,res) => {
    const rp = req.app.locals.rp as RP;
    const authRes = req.body as AuthorizationResponsePayload;
    console.log(authRes)
    try {
        const verifiedAuthRes = await rp.verifyAuthorizationResponse(authRes, {
            presentationDefinitions: [{
                definition: presentationDefinition,
                location: PresentationDefinitionLocation.CLAIMS_VP_TOKEN
            }]
        });
        console.log('Presented', verifiedAuthRes.authorizationResponse.payload);
    } catch (e){
        console.error(`Error while posting presentation ${e}`);
    }
    /*
        If the Response Endpoint has successfully processed the Authorization Response or
        Authorization Error Response, it MUST respond with HTTP status code 200.
        https://openid.github.io/OpenID4VP/openid-4-verifiable-presentations-wg-draft.html#section-6.2-17
     */
    res.sendStatus(200);
}