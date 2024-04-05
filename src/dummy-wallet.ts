import {OP, parseJWT, SigningAlgo, SupportedVersion, PresentationExchange} from "@sphereon/did-auth-siop";
import axios from "axios";
import {JSDOM} from "jsdom";
import os from 'os';

const opKeys = {
    hexPrivateKey: 'd-GexBYTWf1d5Deia3TSooS6zEenQOr9fPmjTWkg10Q',
    did: 'did:web:about.lovremitrovic.me:did-database:wallet',
    didKey: 'did:web:about.lovremitrovic.me:did-database:wallet',
    alg: SigningAlgo.ES256
}

//const issuer = 'http://192.168.1.140:3001/'
const networkInterfaces = os.networkInterfaces();
const issuer = networkInterfaces['wlo1'].filter((obj)=>obj['family']=='IPv4')[0]['address'];

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

    // select vc based on presentation
    const vc = 'eyJhbGciOiJFUzI1NiJ9.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSIsImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL2V4YW1wbGVzL3YxIl0sInR5cGUiOlsiQ292aWRQYXNzcG9ydENyZWRlbnRpYWwiLCJWZXJpZmlhYmxlQ3JlZGVudGlhbCJdLCJpc3N1ZXIiOiJkaWQ6d2ViOkxvdnJlTWl0cm92aWMuZ2l0aHViLmlvOmRpZC1kYXRhYmFzZTppc3N1ZXIiLCJpc3N1YW5jZURhdGUiOiIyMDI0LTA0LTA1VDEwOjE5OjE4Ljg5M1oiLCJjcmVkZW50aWFsU3ViamVjdCI6eyJpZCI6InNwaGVyZW9uOnNzaS13YWxsZXQiLCJtYW51ZmFjdHVyZXIiOiJDb3ZpZCBWYWNjaW5lcyBDcm9hdGlhIEluYy4ifX0sImlzcyI6ImRpZDp3ZWI6TG92cmVNaXRyb3ZpYy5naXRodWIuaW86ZGlkLWRhdGFiYXNlOmlzc3VlciIsInN1YiI6InNwaGVyZW9uOnNzaS13YWxsZXQiLCJpYXQiOjE3MTIzMTIzNjAsImV4cCI6MTcxMjMxOTU2MH0.ylZ16D2aVnRLOB2ogfeG1DhWU4WiIIpQmTg_IVYzN71-848JaBQtDXVbTa9Klcy0jTreILE0nBC3WHxCRNfrkA'
    const pex = new PresentationExchange({
        allDIDs: ['did:web:about.lovremitrovic.me:did-database:wallet'],
        // @ts-ignore
        allVerifiableCredentials: [vc]
    });
    console.log(pex)

    const checked = await pex.selectVerifiableCredentialsForSubmission(verifiedAuthReq.presentationDefinitions[0].definition)
    console.log('=============== pex matches and errors')
    console.log(checked.matches)
    console.log(checked.errors)


}

main()