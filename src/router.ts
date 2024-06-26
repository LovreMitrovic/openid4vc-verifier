import express from 'express';
import {createAuthReq} from "./controllers/createAuthReq.controller";
import {authRequest} from "./controllers/authReq.controller";
import {submitPresentation} from "./controllers/submitPresentation.contoller";
import {authStatus} from "./controllers/authStatus.controller";

const router = express.Router();

router.post('/create-auth-req', createAuthReq);

//this url should expire and aybe use something else instead of corrId https://www.rfc-editor.org/rfc/rfc9101.html
/*
    This url needs to be capability url. Look up
    https://www.rfc-editor.org/rfc/rfc9101.html#name-uri-referencing-the-request and
    https://www.rfc-editor.org/rfc/rfc6819#section-5.1.4.2.2 and
    https://www.w3.org/TR/capability-urls/
 */
router.get('/auth-req/:reference', authRequest);

router.post('/post', submitPresentation);

/*
    Out od scope of specification of protocol OID4VP
 */
router.post('/auth-status', authStatus);
export default router;