import dotenv from 'dotenv';
import express from 'express';
import path from "node:path";
import indexRouter from "./router";
import {initRp} from "./services/verifier";
import {CapabilityUrlsManger} from "./utils/CapabilityUrlsManger";
dotenv.config();

const externalUrl = process.env.RENDER_EXTERNAL_URL;
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine','ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/', indexRouter);

app.locals.capabilityUrlsManager = new CapabilityUrlsManger<string>();

if(externalUrl){
    const hostname = '0.0.0.0';
    app.locals.url = externalUrl;
    app.locals.rp = initRp(app.locals.url);
    app.listen(port, hostname, () => {
        console.log(`Server is running locally on http://${hostname}:${port}/ and from outside on ${externalUrl}`);
    });
} else {
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    const hostname = networkInterfaces['wlo1'].filter((obj)=>obj['family']=='IPv4')[0]['address'];
    app.locals.url = `http://${hostname}:${port}`;
    app.locals.rp = initRp(app.locals.url);
    app.listen(port, () => {
        console.log(`Server is running on local network on http://${hostname}:${port}/ `);
    });
}