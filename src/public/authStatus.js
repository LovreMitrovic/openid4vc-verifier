let idToken;
let vpToken;
function check(){
    let xhr = new XMLHttpRequest();
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
setInterval(check,1000)