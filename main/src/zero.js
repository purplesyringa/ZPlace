import ZeroFrame from "zero-dev-lib/ZeroFrame";
const zf = new ZeroFrame();

import ZeroPage from "zero-dev-lib/ZeroPage";
const zeroPage = new ZeroPage(zf);

import ZeroFS from "zero-dev-lib/ZeroFS";
const zeroFS = new ZeroFS(zeroPage);

import ZeroDB from "zero-dev-lib/ZeroDB";
const zeroDB = new ZeroDB(zeroPage);

import ZeroAuth from "zero-dev-lib/ZeroAuth";
const zeroAuth = new ZeroAuth(zeroPage, [
	"zeroid.bit",
	"kaffie.bit",
	"cryptoid.bit",
	"peak.id",
	"zeroverse.bit",
	"kxoid.bit"
]);
zeroPage.auth = zeroAuth;

export {zeroPage, zeroDB, zeroFS, zeroAuth};