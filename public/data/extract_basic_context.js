
//parse args
const dataset_id = process.argv[2];

const dataset = require(`../data/datasets/movies/${dataset_id}.json`);


const simplified = dataset.map(movie => ({
    id: movie.id,
    title: movie.title,
    overview: movie.overview,
}))

console.log(JSON.stringify(simplified, null, 2))