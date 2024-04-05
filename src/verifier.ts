import {IPresentationDefinition} from "@sphereon/pex/dist/main/lib/types/Internal.types";
import {
    PassBy,
    PropertyTarget,
    ResponseIss,
    ResponseMode,
    ResponseType,
    RevocationVerification,
    RP, Scope,
    SigningAlgo, SubjectType,
    SupportedVersion
} from "@sphereon/did-auth-siop";

const presentationDefinition: IPresentationDefinition ={
    id: "presentation-definition-id",
    input_descriptors: [
        {
            "id": "covid-passport-valid-pd",
            "name": "Covid passport manufacturer name",
            "purpose": "To see is covid passport manufacturer",
            "constraints": {
                "fields": [
                    {
                        "path": [
                            "$.vc.credentialSubject.manufacturer"
                        ]
                    }
                ]
            }
        }
    ]
}


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
        .withPresentationVerification(()=>{
            console.log('PRE-VERIFY')
            const result = {verified:true};
            return new Promise((resolve, reject) => {resolve(result)});
        })
        .withWellknownDIDVerifyCallback(()=>{
            console.log('DID-VERIFY')
            const result = {verified:true};
            return new Promise((resolve, reject) => {resolve(result)});
        })

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
            responseTypesSupported: [ResponseType.ID_TOKEN],//TODO Vp token i gore isto zamjeni
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
        .withClientId(process.env.PUBLIC_KEY_DID)
        //.addDidMethod("web")
        .build()
}