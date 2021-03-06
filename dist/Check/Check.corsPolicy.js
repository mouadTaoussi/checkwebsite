"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function cors(request, response, next) {
    response.header("Access-Control-Allow-Origin", '*');
    response.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    response.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type');
    next();
}
exports.default = cors;
;
