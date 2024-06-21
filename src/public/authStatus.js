let idToken;
let vpToken;
let intervals = [];
function showAuthReqObj(){
    const xhr = new XMLHttpRequest();
    const uri = document.querySelector('#req-uri').innerHTML;
    const uriDecoded = decodeURIComponent(uri);
    const params = {};
    for(let param of uriDecoded.split('?')[1].split('&')){
        console.log(param)
        const key = param.split('=')[0];
        const value = param.split('=')[1];
        params[key] = value;
    }
    console.log(params);
    xhr.open('GET',params['request_uri']);
    xhr.onload = function(){
        const token = this.response;
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayloadString = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const parsed = JSON.parse(jsonPayloadString);
        document.querySelector('#authReqObj').innerHTML = JSON.stringify(parsed, null, 2);
    }
    xhr.send();
}

function check(){
    const xhr = new XMLHttpRequest();
    const correlationId = document.querySelector('#presentation').getAttribute('correlationId');
    xhr.open('POST',`/auth-status`);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.onload = function(){
        if (this.status !== 200){
            console.log('Status is not 200');
            return;
        }
        const response = JSON.parse(this.response);
        console.log(response)
        document.querySelector('#status-text').innerHTML = response.status;
        if(response.status !== 'verified'){
            return;
        }
        const {data} = response;
        document.querySelector('#passport-nbf').innerHTML = (new Date(data.nbf * 1000)).toUTCString();
        document.querySelector('#passport-exp').innerHTML = (new Date(data.exp * 1000)).toUTCString();
        const statusHtml = document.querySelector('#passport-status');
        if(new Date() < new Date(data.exp * 1000)){
            statusHtml.innerHTML = 'VALID';
            statusHtml.style.color = 'green';
        } else {
            statusHtml.innerHTML = 'NOT VALID';
            statusHtml.style.color = 'red';
        }
        document.querySelector('#passport-manufacturer').innerHTML = data.manufacturer;
        document.querySelector('#vp-token').innerHTML = JSON.stringify(response.vpTokenPayload, null, 2);
        document.querySelector('#id-token').innerHTML = JSON.stringify(response.idTokenPayload, null, 2);
        vpToken = response.vpToken;
        idToken = response.idToken;

        document.querySelector('#passport').removeAttribute("hidden");
        document.querySelector('#presentation').setAttribute("hidden","")
    }
    xhr.send(JSON.stringify({correlationId}));
}
intervals.push(setInterval(check,1000));
showAuthReqObj();