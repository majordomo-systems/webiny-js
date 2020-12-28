import { elasticSearchQueryBuilderEqualPlugin } from "../../../src/content/plugins/es/elasticSearchQueryBuilderEqualPlugin";
import { createBlankQuery } from "./helpers";
import { ElasticSearchQueryType } from "@webiny/api-headless-cms/types";

describe("elasticSearchQueryBuilderEqualPlugin", () => {
    const plugin = elasticSearchQueryBuilderEqualPlugin();

    it("should apply must correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            field: "name",
            value: "John"
        });

        plugin.apply(query, {
            field: "name",
            value: "Doe"
        });

        const expected: ElasticSearchQueryType = {
            mustNot: [],
            must: [
                {
                    term: {
                        "name.keyword": "John"
                    }
                },
                {
                    term: {
                        "name.keyword": "Doe"
                    }
                }
            ],
            match: [],
            should: []
        };

        expect(query).toEqual(expected);
    });
});