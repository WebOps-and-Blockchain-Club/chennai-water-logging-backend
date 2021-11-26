import { FloodData } from "../entities/floodData";
import { Arg, Mutation, Query, Resolver } from "type-graphql";
import { createWriteStream } from "fs";
import { FileUpload, GraphQLUpload } from "graphql-upload";
import path from "path";
import { GetFloodDatasOutput } from "../types/objectTypes";
import { FILE_EXTENSIONS } from "../utils/config";
import { MoreThan } from "typeorm";

@Resolver()
export class FloodDataResolver {
  @Query(() => FloodData)
  async getDataByID(@Arg("ID") id: string) {
    return await FloodData.findOneOrFail({ where: { id } });
  }

  @Mutation(() => String)
  async addData(
    @Arg("location") location: string,
    @Arg("depth") depth: string,
    @Arg("image", () => GraphQLUpload) image: FileUpload
  ) {
    const { createReadStream, filename } = image;
    const stream = createReadStream();

    const filetype = path.extname(filename);
    if (!FILE_EXTENSIONS.includes(filetype.toLowerCase()))
      throw new Error(
        `Supported file extensions are ${FILE_EXTENSIONS.join(", ")}`
      );

    const name = Date.now() + "-" + Math.round(Math.random() * 1e9) + filetype;

    return new Promise(async (resolve, _reject) =>
      stream
        .pipe(createWriteStream(__dirname + `/../../public/images/${name}`))
        .on("finish", async () => {
          const data = await FloodData.create({
            location,
            depth,
            image: name,
          }).save();
          resolve(data.id);
        })
        .on("error", (e: any) => {
          console.log(e);
          throw new Error("Image upload failed. Retry");
        })
    );
  }

  //ADMIN
  @Query(() => GetFloodDatasOutput)
  async getDatas(
    @Arg("Password") adminPassword: string,
    @Arg("skip", { nullable: true }) skip: number,
    @Arg("limit", { nullable: true }) take: number,
    @Arg("TimeLimit", { nullable: true }) timeLimit: number
  ) {
    if (adminPassword !== process.env.SECRET) throw new Error("Unauthorized");

    let filter = {};
    if (timeLimit) {
      let date = new Date();
      date.setHours(date.getHours() - timeLimit);
      const dateISOString = new Date(date).toISOString();

      filter = { time: MoreThan(`'${dateISOString}'`) };
    }

    const datas = await FloodData.find({
      where: filter,
      skip,
      take,
    });
    const count = await FloodData.count({
      where: filter,
    });
    return { datas, count };
  }

  //ADMIN
  @Query(() => String)
  async getDataInCSV(@Arg("Password") adminPassword: string) {
    if (adminPassword !== process.env.SECRET) throw new Error("Unauthorized");

    const datas = await FloodData.find();

    let csv = '"Longitude","Latitude","Depth","Timestamp","Image URL"';
    datas.map((data) => {
      const JSONloc = JSON.parse(data.location);

      let date = new Date(data.time);
      date.setHours(date.getHours() + 5);
      date.setMinutes(date.getMinutes() + 30);
      const formatedTime = new Date(date).toLocaleString();

      const imgURL = `https://chennaiwaterlogging.org/node/images/${data.image}`;

      csv += `\n"${JSONloc.longitude}","${JSONloc.latitude}","${data.depth}","${formatedTime}","${imgURL}"`;
    });

    return csv;
  }
}

// curl --request POST \
//     --header 'content-type: application/json' \
//     --url http://localhost:8000/graphql \
//     -F '{"query":"mutation($image: Upload!){\n  addData(image: $image, depth: \"depth\", location: \"location\")\n}","variables":"{\n  \"image\": \"null\"\n}"}' \
//     -F map='{ "0": ["variables.file"] }' \
//     -F 0=@1.png
