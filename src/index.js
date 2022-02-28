import app from "./server";
const PORT = 8000;

app.listen(PORT, () => {
	console.log(`listening on port ${PORT}`);
});
