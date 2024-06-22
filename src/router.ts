import express from 'express';
import {createPresentation} from "./routes/createPresentation.routes";
import {authRequest} from "./routes/authReq.routes";
import {submitPresentation} from "./routes/submitPresentation.routes";
import {authStatus} from "./routes/authStatus.routes";

const router = express.Router();

router.post('/create-presentation', createPresentation);

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