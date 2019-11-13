const onFinished = require('on-finished');



const stringEffects = {
    generateRGB: (red, green, blue, p) => p+';2;'+red+';'+green+';'+blue,
    generateFgRGB: (red, green, blue) => stringEffects.generateRGB(red, green, blue, 38),
    generateBgRGB: (red, green, blue) => stringEffects.generateRGB(red, green, blue, 48),

    reset: 0,

    bold: 1,
    underline: 4,
    reverse: 7,
};

const generateAnsiEffect = (effects) => '\033['+effects.join(';')+'m';
const effectedString = (s, effects) => generateAnsiEffect(effects)+s+generateAnsiEffect([stringEffects.reset]);

function pad(n, width, char, front) {
    n = n+'';
    front = front === undefined ? true : front;

    let nPadded;

    if (n.length >= width) nPadded = n;
    else {
        const padding = (new Array(width-n.length+1)).join(char);

        if (front) nPadded = padding+n;
        else nPadded = n+padding;
    }

    return nPadded;
}



function httpLogger(req, res, next) {
    const e = effectedString;
    const pad2 = (n) => pad(n, 2, '0');

    const method = req.method;
    const url = req.originalUrl;
    const urlExtX = url.split('.');
    const urlExt = urlExtX.length === 1 ? undefined : urlExtX[1];
    const remoteIp = req.ip;
    const date = new Date();
    const dateString = pad2(date.getDate())+'.'+pad2(date.getMonth())+'.'+date.getFullYear()+' '+pad2(date.getHours())+':'+pad2(date.getMinutes())+':'+pad2(date.getSeconds());
    const httpVersion = req.httpVersionMajor+'.'+req.httpVersionMinor;
    const userAgent = req.headers['user-agent'];

    onFinished(res, function(err, res) {
        const status = res.statusCode;
        const contentTypeX = res.get('Content-Type');
        const contentType = contentTypeX === undefined ? undefined : contentTypeX.split(';')[0]
        const responseTime = (new Date())-date;

        let message = '';

        if (urlExt === undefined) {
            message += '['+dateString+'] ('+remoteIp+') '+method+' '+url+' HTTP/'+httpVersion+' > '

            let color;

            if (status >= 500) color = [255, 0, 0];
            else if (status >= 400) color = [255, 165, 0];
            else if (status >= 300) color = [192,192,192];
            else if (status >= 200) color = [0, 255, 0];
            else color = [0, 0, 0]

            message += e(status, [stringEffects.generateFgRGB(color[0], color[1], color[2])]);

            if (status === 304) {
                message += ' Not modified'
            } else {
                message += ' '+contentType;
            }

            message += ' ('+responseTime+' ms)'
        }

        if (message !== '') console.log(message);
    })

    // console.log(e('Heloo world', [stringEffects.underline, stringEffects.generateFgRGB(0, 120, 255)]));

    next();
}



module.exports = {
    httpLogger: httpLogger,
}