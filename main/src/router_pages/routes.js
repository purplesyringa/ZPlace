import Home from "./home/home.vue";
import Place from "./place/place.vue";

export default vue => [
	{
		path: "",
		controller: () => {
			vue.currentView = Home;
		}
	},

	{
		path: "place",
		controller: () => {
			vue.currentView = Place;
		}
	}
];