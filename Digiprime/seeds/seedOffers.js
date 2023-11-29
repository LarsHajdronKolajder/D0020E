const mongoose = require("mongoose");
const cities = require("./cities");
const { places, descriptors } = require("./seedHelpers");
const Offer = require("../models/offer");
const User = require("../models/user");

const OFFER_AMOUNT = 100;
const MIN_PRICE = 100;
const MAX_PRICE = 1000;

const OfferInterest = ["Supply", "Demand"];
const ReferenceSector = ["Composites", "Batteries"];
const ReferenceType = ["Material", "Product"];

mongoose.connect("mongodb://localhost:27017/offer-test", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected");
});

const sample = (array) => array[Math.floor(Math.random() * array.length)];
const between = (min, max) => min + Math.floor(Math.random() * (max - min));

const seedDB = async () => {
  const users = await User.find().exec();
  if (users.length === 0) {
    throw new Error("There must exist users before seeding Offers");
  }
  const getRandomUserId = () => {
    const idx = Math.floor(Math.random() * users.length);
    return users[idx]._id;
  };

  await Offer.deleteMany({});
  for (let i = 0; i < OFFER_AMOUNT; i++) {
    const city = sample(cities);
    const author = sample(users)._id;
    const price = Math.floor(between(MIN_PRICE, MAX_PRICE) / 10) * 10;
    const title = `${sample(descriptors)} ${sample(places)}`;

    const camp = new Offer({
      author,
      location: `${city.city}, ${city.state}`,
      title,
      description:
        "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsa quas, voluptatibus labore molestias, asperiores commodi dignissimos hic ab earum eos sunt laboriosam obcaecati placeat eveniet, praesentium minima repudiandae corporis veritatis.",
      price,
      costumer: sample(OfferInterest),
      referenceSector: sample(ReferenceSector),
      referenceType: sample(ReferenceType),
      geometry: {
        type: "Point",
        coordinates: [city.longitude, city.latitude],
      },
      images: [
        {
          url: "https://res.cloudinary.com/diq0t2bqj/image/upload/v1622925764/YelpCamp/kjhxxshjrdudgkoehoyl.jpg",
          filename: "YelpCamp/kjhxxshjrdudgkoehoyl",
        },
        {
          url: "https://res.cloudinary.com/diq0t2bqj/image/upload/v1622925764/YelpCamp/zhvnroyfodtcu1baecfn.jpg",
          filename: "YelpCamp/zhvnroyfodtcu1baecfn",
        },
      ],
    });
    await camp.save();
  }
};

seedDB()
  .then(() => {
    console.log("Seeding done");
  })
  .catch((error) => {
    console.error("Error during seeding:", error);
  })
  .finally(() => {
    mongoose.connection.close();
  });
