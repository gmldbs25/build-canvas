import detailsArticleSource from "../../../docs/transformer-to-agent/work3-details-article-v4.md?raw";
import { parseDetailsArticle } from "@/content/details-parser";

export const detailsArticle = parseDetailsArticle(detailsArticleSource);
