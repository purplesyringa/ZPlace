<template>
	<div class="root">
		<h1>
			<span class="r">/z/</span>
			<span class="p">p</span>
			<span class="l">l</span>
			<span class="a">a</span>
			<span class="c">c</span>
			<span class="e">e</span>
		</h1>

		<template v-if="loggedIn">
			<button @click="login">Logout</button>
			<button @click="go">Continue as {{username}}</button>

			Use <b>Shift+Mouse</b> for navigation.<br>
			Use <b>Click</b> to put pixel.<br>
			Go build your favorite thing.
		</template>
		<template v-else>
			<button @click="login">Login</button>
		</template>
	</div>
</template>

<style lang="sass" scoped>
	.root
		position: absolute
		top: 50%
		transform: translateY(-50%)

		width: 100%
		height: 256px
		text-align: center

	h1
		font-family: "Roboto Bold"
		font-size: 0

		span
			font-size: 128px

			&.r
				color: #888
				font-family: "Roboto Light"
			&.p
				color: #F00
			&.l
				color: #DA0
			&.a
				color: #0D0
			&.c
				color: #0DC
			&.e
				color: #00F

	button
		display: block
		margin: 8px auto
		padding: 8px 16px
		border: none
		background-color: #EDD
		border-bottom: 2px solid #A88

		transition: all 0.5s

		cursor: pointer

		&:hover
			background-color: #222
			color: #FDD
</style>

<script type="text/javascript">
	import {zeroPage, zeroAuth} from "@/zero";

	export default {
		name: "home",

		computed: {
			loggedIn() {
				return !!this.$store.state.siteInfo.cert_user_id;
			},
			username() {
				return this.$store.state.siteInfo.cert_user_id;
			}
		},

		methods: {
			login() {
				// We're not using ZeroAuth.requestAuth() because it won't
				// work for re-login
				zeroPage.cmd("certSelect", {
					accepted_domains: zeroAuth.acceptedDomains
				});
			},

			go() {
				this.$router.navigate("place");
			}
		}
	};
</script>