import {OP, SigningAlgo, SupportedVersion} from "@sphereon/did-auth-siop";
import axios from "axios";

const opKeys = {
    hexPrivateKey: 'd-GexBYTWf1d5Deia3TSooS6zEenQOr9fPmjTWkg10Q',
    did: 'did:web:about.lovremitrovic.me:did-database:wallet',
    didKey: 'did:web:about.lovremitrovic.me:did-database:wallet',
    alg: SigningAlgo.ES256
}

const issuer = 'http://192.168.1.140:3001/'

const op = OP.builder()
    .withExpiresIn(6000)
    .withIssuer(issuer)
    .addDidMethod('did:web')
    .withInternalSignature(opKeys.hexPrivateKey, opKeys.did, opKeys.didKey, opKeys.alg)
    //.withPresentationSignCallback()
    .addSupportedVersion(SupportedVersion.SIOPv2_D12_OID4VP_D18)
    .addSupportedVersion(SupportedVersion.SIOPv2_D11)
    .addSupportedVersion(SupportedVersion.SIOPv2_ID1)
    .addSupportedVersion(SupportedVersion.JWT_VC_PRESENTATION_PROFILE_v1)
    .build()

// ovo je onaj interact end-usera i verifiera implementiran kao get
const main = async () =>
{
    // this creates presentation auth req
    const authReq = await axios.get('http://localhost:3001/example-presentation')


    console.log('================ Auth req dohvaćen sa /example-presentation ==============');
    const reqUri = 'openid-vc://?request_uri=http%3A%2F%2F192.168.1.140%3A3001%2Fref';
    const parsedReqURI = await op.parseAuthorizationRequestURI(reqUri);
    console.log(parsedReqURI)
    // automatski i parsa uri
    const verifiedAuthReq = await op.verifyAuthorizationRequest(reqUri)
    console.log(verifiedAuthReq.jwt)
    console.log(verifiedAuthReq.presentationDefinitions)
}

main()