import {
  getTableFromData,
  getTalkingPointForIntro,
  getTalkingPointForOutro,
  getTitlesFromData,
} from "./openai";
import {
  CustomImageDataFromBing,
  VideoMetadata,
  VideoIntro,
  VideoSection,
  VideoTable,
  VideoOutro,
  CustomImageDataFromGoogleSerpapi,
} from "./interfaces";
import { createTTSAudio } from "./textToSpeech";
import { getGoogleImages } from "./serpapi/images";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getVideoSectionsMedia(props: {
  metadata: VideoMetadata;
  talkingPoints: string[];
  titles: string[];
  fileDirectory: string;
}): Promise<VideoSection[]> {
  console.time("getVideoSectionsData()"); // start the timer
  console.log(`😇 Trying to get Video sections media!`);

  // Get all images one by one (Thanks Azure Ratelimits on Free tier!)
  const allRelevantImages: CustomImageDataFromBing[][] = [];
  for (const title of props.titles) {
    const imgsForVideoSection = (await getGoogleImages({
      query: title,
      count: 3,
    })) as CustomImageDataFromBing[];

    allRelevantImages.push(imgsForVideoSection);
  }

  const dataWithoutImages = [];

  for (let index = 0; index < props.talkingPoints.length; index++) {
    const talkingPoint = props.talkingPoints[index];
    const text = `${props.titles[index]}. ${talkingPoint}`;

    const maleVoice = await createTTSAudio({
      text,
      gender: "male",
      fileDirectory: props.fileDirectory,
    });

    await sleep(3000);

    const femaleVoice = await createTTSAudio({
      text,
      gender: "female",
      fileDirectory: props.fileDirectory,
    });

    dataWithoutImages.push({
      talkingPoint,
      title: props.titles[index],
      voiceAudio: {
        urls: [maleVoice.url, femaleVoice.url] as [string, string],
        durations: [maleVoice.duration, femaleVoice.duration] as [
          number,
          number
        ],
      },
    });
  }

  const finalData: VideoSection[] = dataWithoutImages.map((section, index) => {
    return {
      ...section,
      images: allRelevantImages[index],
    };
  });

  console.timeEnd("getVideoSectionsData()"); // stop the timer
  return finalData;
}

export async function getVideoIntro(
  props: {
    formattedContentsOfVideo: string;
    metadata: VideoMetadata;
    fileDirectory: string;
    // Keep titles to get decent images for intro?
    titles: Awaited<ReturnType<typeof getTitlesFromData>>;
  },
  userId: string
): Promise<VideoIntro> {
  /**
   * ! HERE, DO THE MULTIPLE DURATIONS FOR AUDIO. :)
   */
  console.time("getVideoIntroOutroMedia()"); // start the timer
  console.log(`😇 Trying to get Video intro media!`);

  /**
   * ! FIXME: GET THE TALKING POINT FOR INTRO AND OUTRO
   */
  const { talkingPoint: introTalkingPoint } = await getTalkingPointForIntro(
    props.metadata,
    props.formattedContentsOfVideo,
    userId
  );

  const introResults = [];

  for (let index = 0; index < [introTalkingPoint].length; index++) {
    const talkingPoint = [introTalkingPoint][index];
    console.log(`Creating Intro audio #${index + 1}`);

    const text = talkingPoint;

    // Create male and female voice audios
    const maleVoice = await createTTSAudio({
      text,
      gender: "male",
      fileDirectory: props.fileDirectory,
    });

    await sleep(3000);

    const femaleVoice = await createTTSAudio({
      text,
      gender: "female",
      fileDirectory: props.fileDirectory,
    });

    // Get 3 images for topic
    const relevantImages = await getGoogleImages({
      query: props.metadata.topic,
      count: 3,
    });

    introResults.push({
      images: relevantImages,
      talkingPoint,
      voiceAudio: {
        urls: [maleVoice.url, femaleVoice.url] as [string, string],
        durations: [maleVoice.duration, femaleVoice.duration] as [
          number,
          number
        ],
      },
    });
  }

  const intro = introResults[0];

  console.timeEnd("getVideoIntroOutroMedia()"); // stop the timer

  return intro;
}

export async function getVideoOutro(
  props: {
    formattedContentsOfVideo: string;
    metadata: VideoMetadata;
    fileDirectory: string;
  },
  userId: string
): Promise<VideoOutro> {
  console.time("getVideoOutroMedia()"); // start the timer
  console.log(`😇 Trying to get Video intro media!`);

  const { talkingPoint: outroTalkingPoint } = await getTalkingPointForOutro(
    props.formattedContentsOfVideo,
    userId
  );

  const outroResults = [];

  for (let index = 0; index < [outroTalkingPoint].length; index++) {
    const talkingPoint = [outroTalkingPoint][index];
    console.log(`Creating Outro audio #${index + 1}`);

    const text = talkingPoint;

    // Create male and female voice audios
    const maleVoice = await createTTSAudio({
      text,
      gender: "male",
      fileDirectory: props.fileDirectory,
    });

    await sleep(3000);

    const femaleVoice = await createTTSAudio({
      text,
      gender: "female",
      fileDirectory: props.fileDirectory,
    });

    // Optionally get 3 images for the topic if needed
    // const relevantImages = await getBingImages({
    //   query: props.metadata.topic,
    //   count: 3,
    // });

    outroResults.push({
      // images: relevantImages,
      talkingPoint,
      voiceAudio: {
        urls: [maleVoice.url, femaleVoice.url] as [string, string],
        durations: [maleVoice.duration, femaleVoice.duration] as [
          number,
          number
        ],
      },
    });
  }

  const outro = outroResults[0];

  console.timeEnd("getVideoOutroMedia()"); // stop the timer

  return outro;
}

export async function getVideoTableMedia(props: {
  metadata: VideoMetadata;
  tableData: Awaited<ReturnType<typeof getTableFromData>>;
  fileDirectory: string;
}): Promise<VideoTable> {
  const tableLabel = props.metadata.table?.label ?? "";
  // Return empty table if no table label is present
  if (tableLabel.length < 2)
    return {
      isPresent: false,
      summary: "",
      table: "",
      voiceAudio: {
        urls: ["", ""],
        durations: [0, 0],
      },
    };

  console.time("getVideoTableMedia()"); // start the timer
  console.log(`😇 Trying to get Video table media!`);

  const tableSummary = props.tableData?.summary;

  const tableResults = [];

  for (let index = 0; index < [tableSummary].length; index++) {
    const talkingPoint = [tableSummary][index];
    console.log(`Creating speech audio for #${index + 1}`);

    const text = talkingPoint;

    // Create male and female voice audios
    const maleVoice = await createTTSAudio({
      text,
      gender: "male",
      fileDirectory: props.fileDirectory,
    });

    await sleep(3000);

    const femaleVoice = await createTTSAudio({
      text,
      gender: "female",
      fileDirectory: props.fileDirectory,
    });

    tableResults.push({
      ...props.tableData,
      voiceAudio: {
        urls: [maleVoice.url, femaleVoice.url] as [string, string],
        durations: [maleVoice.duration, femaleVoice.duration] as [
          number,
          number
        ],
      },
    });
  }

  const finalData = tableResults[0];

  console.timeEnd("getVideoTableMedia()"); // stop the timer

  return { ...finalData, isPresent: true };
}
