import { FloodData } from "../entities/floodData";
import { Arg, Mutation, Query, Resolver } from "type-graphql";
import { createWriteStream } from "fs";
import { FileUpload, GraphQLUpload } from "graphql-upload";
import path from "path";

@Resolver()
export class FloodDataResolver {
  @Query(() => String)
  helloworld() {
    return "Hello World";
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
    const name = Date.now() + "-" + Math.round(Math.random() * 1e9) + filetype;

    return new Promise(async (resolve, _reject) =>
      stream
        .pipe(createWriteStream(__dirname + `/../../public/images/${name}`))
        .on("finish", async () => {
          const data = await FloodData.create({
            location,
            depth,
            image: `http://localhost:8000/images/${name}`,
          }).save();
          resolve(data.id);
        })
        .on("error", (e: any) => {
          console.log(e);
          throw new Error("Image upload failed. Retry");
        })
    );
  }
}

// curl --request POST \
//     --header 'content-type: application/json' \
//     --url http://localhost:8000/graphql \
//     -F '{"query":"mutation($image: Upload!){\n  addData(image: $image, depth: \"depth\", location: \"location\")\n}","variables":"{\n  \"image\": \"null\"\n}"}' \
//     -F map='{ "0": ["variables.file"] }' \
//     -F 0=@1.png
