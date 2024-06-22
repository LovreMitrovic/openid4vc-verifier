import {parseJWT, PresentationVerificationResult} from "@sphereon/did-auth-siop";
import {PEX} from "@sphereon/pex";
import {UniResolver} from "@sphereon/did-uni-client";
import {compactVerify, importJWK} from "jose";
import jp from "jsonpath";
import {presentationDefinition} from "./verifier";

export const presentationVerificationCallback = async (args, presentationSubmission)=> {
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
}