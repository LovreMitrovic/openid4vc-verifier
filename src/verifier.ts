import {IPresentationDefinition} from "@sphereon/pex/dist/main/lib/types/Internal.types";
import {
    InMemoryRPSessionManager,
    parseJWT,
    PassBy, PresentationVerificationResult,
    PropertyTarget,
    ResponseIss,
    ResponseMode,
    ResponseType,
    RevocationVerification,
    RP, Scope,
    SigningAlgo, SubjectType,
    SupportedVersion
} from "@sphereon/did-auth-siop";
import {compactVerify, decodeJwt, importJWK, JWTVerifyResult} from "jose";
import {UniResolver} from "@sphereon/did-uni-client";
import { PEX } from '@sphereon/pex';
import jp from "jsonpath";
import EventEmitter from "node:events";

export const presentationDefinition: IPresentationDefinition ={
    id: "presentation-definition-id",
    name: "Covid passpoer manufacturer name",
    purpose: "Identify manufacturer of covid vaccinee",
    input_descriptors: [
        {
            "id": "covid-passport-valid-pd",
            "name": "Covid passport manufacturer name",
            "purpose": "To see is covid passport manufacturer",
            "group": ["A"],
            "constraints": {
                "fields": [
                    {
                        "path": [
                            "$.vc.credentialSubject.manufacturer",
                            "$.credentialSubject.manufacturer"
                        ]
                    }
                ]
            }
        }
    ]
}

const eventEmiter = new EventEmitter();


export const initRp = (url:string ):RP => {
    const rpKeys = {
        hexPrivateKey: process.env.PRIVATE_KEY_HEX,
        did: process.env.PUBLIC_KEY_DID,
        didKey: process.env.PUBLIC_KEY_DID,
        alg: SigningAlgo.ES256
    }

    return RP.builder()
        //.withRedirectUri(`${url}/redirect`)
        .withRequestBy(PassBy.REFERENCE,`${url}/ref`)
        .withResponseMode(ResponseMode.POST)
        .withInternalSignature(rpKeys.hexPrivateKey, rpKeys.did, rpKeys.didKey, rpKeys.alg)
        .withSignature(rpKeys)
        .withIssuer(ResponseIss.JWT_VC_PRESENTATION_V1)
        .withPresentationVerification(async (args, presentationSubmission)=>{
            let result: PresentationVerificationResult;
            try {
                if (typeof args !== "string") {
                    throw new Error("App only supports presentations encoded in JWT")
                }
                const pex = new PEX();
                const resolver = new UniResolver();

                const presentationDecoded = parseJWT(args);
                const walletDid = await resolver.resolve(presentationDecoded.payload.iss);
                const walletKey = await importJWK(walletDid.didDocument.verificationMethod[0].publicKeyJwk);
                const verificationResult = await compactVerify(args, walletKey); // throws error if signature is not right

                const pexResult = pex.evaluatePresentation(presentationDefinition, args)
                if(pexResult.errors.length > 0){
                    throw new Error(`Error during evaluating presentation ${pexResult.errors.toString()}`)
                }
                const credentials = []
                for(let descriptor of pexResult.value.descriptor_map){
                    const selectedCredentials = jp.query(presentationDecoded.payload.vp, descriptor.path);
                    selectedCredentials.forEach((credential) => credentials.push(credential))
                }
                for(let credential of credentials){
                    const credentialDecoded = parseJWT(credential);
                    const issuerDid = await resolver.resolve(credentialDecoded.payload.iss);
                    const issuerKey = await importJWK(issuerDid.didDocument.verificationMethod[0].publicKeyJwk)
                    const verificationResult = await compactVerify(credential, issuerKey); // throws error if signature is not right
                }
                result = {verified:true};
            } catch(err) {
                result = {verified:false, reason:err};
            }
            return new Promise((resolve, reject) => {resolve(result)});
        })
        /*
        .withWellknownDIDVerifyCallback(()=>{
            console.log('DID-VERIFY')
            const result = {verified:true};
            return new Promise((resolve, reject) => {resolve(result)});
        })
        */
        .withRevocationVerification(RevocationVerification.NEVER)
        .withSupportedVersions(SupportedVersion.JWT_VC_PRESENTATION_PROFILE_v1)
        .withResponseType(ResponseType.ID_TOKEN)
        //.addDidMethod("did:web")
        .withClientMetadata({
            //clientName: undefined,
            //clientPurpose: undefined,
            //client_id: undefined,
            //logo_uri: undefined,
            subject_syntax_types_supported: ['did', 'did:web', 'did:jwk'],
            idTokenSigningAlgValuesSupported: [SigningAlgo.ES256],
            requestObjectSigningAlgValuesSupported: [SigningAlgo.ES256],
            responseTypesSupported: [ResponseType.ID_TOKEN],
            vpFormatsSupported: {jwt_vc: {alg: [SigningAlgo.ES256]}},
            scopesSupported: [Scope.OPENID_DIDAUTHN, Scope.OPENID],
            subjectTypesSupported: [SubjectType.PAIRWISE],
            subjectSyntaxTypesSupported: ['did', 'did:web', 'did:jwk'],
            passBy: PassBy.VALUE
            //passBy: PassBy.REFERENCE,
            //reference_uri: `${url}/ref`
        })
        .withPresentationDefinition({
            definition: presentationDefinition,
            //definitionUri: `${url}/def`
        }, PropertyTarget.REQUEST_OBJECT) // valjda default radi i bez ovoga
        .withClientId(`${url}`)
        //.addDidMethod("web")
        .withSessionManager(new InMemoryRPSessionManager(eventEmiter))
        .withEventEmitter(eventEmiter)
        .build()
}