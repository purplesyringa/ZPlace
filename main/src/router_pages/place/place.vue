<template>
	<div class="root" @mouseup="onMouseUp" @mousemove="onMouseMove">
		<canvas ref="canvas" @mousedown="onMouseDown" />
		<div class="palette">
			<div
				v-for="color, i in COLORS"
				:class="['item', {chosen: currentColor === i}]"
				:style="{backgroundColor: color}"
				@click="chooseColor(i)"
			/>
		</div>
	</div>
</template>

<style lang="sass" scoped>
	.root
		width: 100%
		height: 100%
		overflow: hidden

		background-color: #000

	canvas
		cursor: pointer

	.palette
		position: absolute
		right: 16px
		top: 16px
		padding: 8px 4px
		font-size: 0

		z-index: 100

		background-color: #FFF
		border-radius: 4px
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6)

		.item
			display: inline-block
			width: 32px
			height: 32px
			margin: 0 4px

			vertical-align: middle

			cursor: pointer

			&.chosen
				border: 2px solid #000
				padding: 2px
				margin: -2px 4px
</style>

<script type="text/javascript">
	import {WIDTH, HEIGHT, DEFAULT_SCALE, PADDING, MAX_TRANSFORM, COLORS} from "@/constants";
	import {zeroPage, zeroFS} from "@/zero";

	export default {
		name: "place",
		data() {
			let pixels = [];
			for(let y = 0; y < HEIGHT; y++) {
				pixels.push([]);
				for(let x = 0; x < WIDTH; x++) {
					pixels[y].push(7);
				}
			}

			let lastUpdate = [];
			for(let y = 0; y < HEIGHT; y++) {
				lastUpdate.push([]);
				for(let x = 0; x < WIDTH; x++) {
					lastUpdate[y].push(0);
				}
			}

			return {
				scale: DEFAULT_SCALE,
				pixels,
				lastUpdate,
				x: MAX_TRANSFORM,
				y: MAX_TRANSFORM,
				context: null,
				mousePressed: false,
				dragX: 0,
				dragY: 0,
				transformX: 0,
				transformY: 0,
				currentColor: 0,
				COLORS
			};
		},
		async mounted() {
			if(!this.$store.state.siteInfo.cert_user_id) {
				// Not logged in
				this.$router.navigate("");
				return;
			}

			this.context = this.$refs.canvas.getContext("2d");
			this.drawCanvas(true);
			window.addEventListener("resize", this.onResize);

			// Load from database
			const list = await zeroFS.readDirectory("data/users");
			for(const address of list) {
				if(address.endsWith(".json")) {
					continue;
				}
				this.loadPixelsOf(address);
			}

			zeroPage.on("peerReceive", this.onPeerReceive);

			const permissions = this.$store.state.siteInfo.settings.permissions;
			if(permissions.indexOf("NOSANDBOX") > -1) {
				// Hide all notifications
				const notifications = top.document.querySelector(".notifications");
				notifications.style.display = "none";
			}
		},
		destroyed() {
			window.removeEventListener("resize", this.onResize);
			zeroPage.off("peerReceive", this.onPeerReceive);
		},

		methods: {
			async loadPixelsOf(address) {
				let data = await zeroFS.readFile(`data/users/${address}/data.txt`);
				data = data.split(";");

				for(const pixel of data) {
					let [x, y, color, lastUpdate] = pixel.split("/");
					x = +x;
					y = +y;
					color = +color;
					lastUpdate = +lastUpdate;

					if(!(x >= 0 && x < WIDTH)) {
						return;
					} else if(!(y >= 0 && y < HEIGHT)) {
						return;
					} else if(!(color >= 0 && color < COLORS.length)) {
						return;
					}

					if(lastUpdate > this.lastUpdate[y][x]) {
						this.lastUpdate[y][x] = lastUpdate;
						this.pixels[y][x] = color;
					}
				}

				this.drawCanvas(true);
			},

			drawCanvas(force=false) {
				// Check transform -- if it's small, just scroll,
				// don't rerender.

				if(
					force ||
					Math.abs(this.transformX) > MAX_TRANSFORM ||
					Math.abs(this.transformY) > MAX_TRANSFORM
				) {
					// Resize & clear canvas
					this.$refs.canvas.width = document.body.offsetWidth + MAX_TRANSFORM * 2;
					this.$refs.canvas.height = document.body.offsetHeight + MAX_TRANSFORM * 2;

					this.x += this.transformX;
					this.y += this.transformY;
					this.transformX = 0;
					this.transformY = 0;
					this.updateTransform();

					// Draw
					for(let y = 0; y < HEIGHT; y++) {
						for(let x = 0; x < WIDTH; x++) {
							this.drawCell(x, y);
						}
					}
				} else {
					// Scroll
					this.updateTransform();
				}
			},
			updateTransform() {
				const transform = `translate(${-this.transformX - MAX_TRANSFORM}px, ${-this.transformY - MAX_TRANSFORM}px)`;
				this.$refs.canvas.style.transform = transform;
			},
			drawCell(x, y) {
				const viewPortX = x * (this.scale + PADDING) + PADDING - this.x;
				const viewPortY = y * (this.scale + PADDING) + PADDING - this.y;
				if(viewPortX < -this.scale || viewPortX > this.$refs.canvas.width) {
					return;
				}
				if(viewPortY < -this.scale || viewPortY > this.$refs.canvas.height) {
					return;
				}

				this.context.fillStyle = COLORS[this.pixels[y][x]];
				this.context.fillRect(viewPortX, viewPortY, this.scale, this.scale);
			},

			onMouseDown(e) {
				this.dragX = e.clientX;
				this.dragY = e.clientY;
				this.mousePressed = e.shiftKey;
			},
			onMouseMove(e) {
				if(!this.mousePressed) {
					return;
				}

				const dX = this.dragX - e.clientX;
				const dY = this.dragY - e.clientY;
				this.transformX += dX;
				this.transformY += dY;
				this.dragX = e.clientX;
				this.dragY = e.clientY;

				this.drawCanvas();
			},
			async onMouseUp(e) {
				if(this.mousePressed) {
					// Scroll
					this.mousePressed = false;
					const dX = this.dragX - e.clientX;
					const dY = this.dragY - e.clientY;
					this.transformX += dX;
					this.transformY += dY;

					this.drawCanvas();
				} else {
					// Put
					const viewPortX = e.clientX;
					const viewPortY = e.clientY;
					if(Math.abs(viewPortX - this.dragX) > this.scale) {
						return;
					}
					if(Math.abs(viewPortY - this.dragY) > this.scale) {
						return;
					}

					const x = Math.floor((viewPortX + MAX_TRANSFORM + this.x + this.transformX - PADDING) / (this.scale + PADDING));
					const y = Math.floor((viewPortY + MAX_TRANSFORM + this.y + this.transformY - PADDING) / (this.scale + PADDING));

					this.pixels[y][x] = this.currentColor;

					// Update lastUpdate
					let date = Date.now();
					if(date <= this.lastUpdate[y][x]) {
						date = this.lastUpdate[y][x] + 100;
					}

					// Broadcast
					const str = `${x}/${y}/${this.currentColor}/${date}`;
					zeroPage.cmd("peerBroadcast", {
						message: {str},
						immediate: true
					});

					// Save to file
					const authAddress = this.$store.state.siteInfo.auth_address;
					let data;
					try {
						data = (await zeroFS.readFile(`data/users/${authAddress}/data.txt`)).split(";");
					} catch(e) {
						data = [];
					}
					data.push(str);
					await zeroFS.writeFile(`data/users/${authAddress}/data.txt`, data.join(";"));

					// Sign & publish
					await zeroPage.publish(`data/users/${authAddress}/content.json`);

					this.askNoSandbox();
				}
			},
			onResize() {
				this.drawCanvas(true);
			},
			onPeerReceive({params: {hash, message: {str}, ip}}) {
				if(str) {
					let [x, y, color, lastUpdate] = str.split("/");
					x = +x;
					y = +y;
					color = +color;
					lastUpdate = +lastUpdate;

					if(!(x >= 0 && x < WIDTH)) {
						zeroPage.cmd("peerInvalid", [hash]);
						return;
					} else if(!(y >= 0 && y < HEIGHT)) {
						zeroPage.cmd("peerInvalid", [hash]);
						return;
					} else if(!(color >= 0 && color < COLORS.length)) {
						zeroPage.cmd("peerInvalid", [hash]);
						return;
					}

					if(lastUpdate > this.lastUpdate[y][x]) {
						this.lastUpdate[y][x] = lastUpdate;
					}
					this.pixels[y][x] = color;
					this.drawCell(x, y);

					zeroPage.cmd("peerValid", [hash]);
				} else {
					zeroPage.cmd("peerInvalid", [hash]);
				}
			},

			chooseColor(i) {
				this.currentColor = i;
			},

			async askNoSandbox() {
				let localStorage = await zeroPage.cmd("wrapperGetLocalStorage");
				if(!localStorage) {
					localStorage = {};
				}

				if(localStorage.dismissNoSandbox) {
					// Dismissed
					return;
				}

				const result = await zeroPage.confirm(
					"<b>You can remove those \"Published...\" messages by<br>" +
					"adding NOSANDBOX permission. No harm, I promise.</b>",
					["Okay", "Never ask me again"]
				);

				// Never ask again in both cases
				localStorage.dismissNoSandbox = true;
				await zeroPage.cmd("wrapperSetLocalStorage", localStorage);

				if(result === 1) {
					// Okay
					zeroPage.cmd("wrapperPermissionAdd", ["NOSANDBOX"]);

					const onSetSiteInfo = siteInfo => {
						if(siteInfo.settings.permissions.indexOf("NOSANDBOX") > -1) {
							top.location.href = `/${siteInfo.address}/?/place`;
						}
					};
					this.$eventBus.$on("setSiteInfo", onSetSiteInfo);
				}
			}
		}
	};
</script>