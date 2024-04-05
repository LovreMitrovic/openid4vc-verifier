import {OP, parseJWT, SigningAlgo, SupportedVersion} from "@sphereon/did-auth-siop";
import axios from "axios";
import {JSDOM} from "jsdom";

const opKeys = {
    hexPrivateKey: 'd-GexBYTWf1d5Deia3TSooS6zEenQOr9fPmjTWkg10Q',
    did: 'did:web:about.lovremitrovic.me:did-database:wallet',
    didKey: 'did:web:about.lovremitrovic.me:did-database:wallet',
    alg: SigningAlgo.ES256
}

//const issuer = 'http://192.168.1.140:3001/'
const issuer = 'http://10.129.5.145:3001/'

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
    const dom = new JSDOM(authReq.data);
    const reqUri = dom.window.document.querySelector("#req-uri").textContent;
    const parsedReqURI = await op.parseAuthorizationRequestURI(reqUri);
    console.log(parsedReqURI)
    // automatski i parsa uri
    const verifiedAuthReq = await op.verifyAuthorizationRequest(reqUri)
    console.log(verifiedAuthReq.jwt)
    const parsedJwt = parseJWT(verifiedAuthReq.jwt).payload
    console.log(parsedJwt)
    console.log(verifiedAuthReq.presentationDefinitions)
}

main()