import {IPresentationDefinition} from "@sphereon/pex/dist/main/lib/types/Internal.types";
import {
    InMemoryRPSessionManager,
    PassBy, PresentationVerificationCallback,
    PropertyTarget,
    ResponseIss,
    ResponseMode,
    ResponseType,
    RevocationVerification,
    RP, Scope,
    SigningAlgo, SubjectType,
    SupportedVersion
} from "@sphereon/did-auth-siop";
import EventEmitter from "node:events";
import {presentationVerificationCallback} from "./presentationVerificationCallback";

export const presentationDefinition: IPresentationDefinition ={
    id: "presentation-definition-id",
    name: "Covid passpoer manufacturer name",
    purpose: "Identify manufacturer of covid vaccinee",
    input_descriptors: [
        {
            "id": "covid-passport-valid-pd",
            "name": "Covid passport manufacturer name",
            "purpose": "To see is covid passport manufacturer",
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
        .withRequestBy(PassBy.REFERENCE, `${url}/auth-req`)
        .withResponseMode(ResponseMode.POST)
        .withInternalSignature(rpKeys.hexPrivateKey, rpKeys.did, rpKeys.didKey, rpKeys.alg)
        .withSignature(rpKeys)
        .withIssuer(ResponseIss.JWT_VC_PRESENTATION_V1)
        .withPresentationVerification(presentationVerificationCallback as PresentationVerificationCallback)
        .withRevocationVerification(RevocationVerification.NEVER)
        .withSupportedVersions(SupportedVersion.JWT_VC_PRESENTATION_PROFILE_v1)
        .withResponseType(ResponseType.ID_TOKEN)
        .withClientMetadata({
            subject_syntax_types_supported: ['did', 'did:web', 'did:jwk'],
            idTokenSigningAlgValuesSupported: [SigningAlgo.ES256],
            requestObjectSigningAlgValuesSupported: [SigningAlgo.ES256],
            responseTypesSupported: [ResponseType.ID_TOKEN],
            vpFormatsSupported: {jwt_vc: {alg: [SigningAlgo.ES256]}},
            scopesSupported: [Scope.OPENID_DIDAUTHN, Scope.OPENID],
            subjectTypesSupported: [SubjectType.PAIRWISE],
            subjectSyntaxTypesSupported: ['did', 'did:web', 'did:jwk'],
            passBy: PassBy.VALUE
        })
        .withPresentationDefinition({
            definition: presentationDefinition,
        }, PropertyTarget.REQUEST_OBJECT)
        .withClientId(`${url}`)
        .withSessionManager(new InMemoryRPSessionManager(eventEmiter))
        .withEventEmitter(eventEmiter)
        .build()
}