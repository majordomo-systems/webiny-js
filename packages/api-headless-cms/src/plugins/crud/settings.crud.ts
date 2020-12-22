import { ContextPlugin } from "@webiny/handler/types";
import Error from "@webiny/error";
import * as utils from "../../utils";
import {
    CmsContext,
    CmsSettingsContextType,
    CmsSettingsPermissionType,
    CmsSettingsType,
    DbItemTypes
} from "../../types";

const initialContentModelGroup = {
    name: "Ungrouped",
    slug: "ungrouped",
    description: "A generic content model group",
    icon: "fas/star"
};

const SETTINGS_SECONDARY_KEY = "settings";

export default {
    type: "context",
    name: "context-settings-crud",
    apply(context) {
        const { db } = context;

        const PK_SETTINGS = () => `${utils.createCmsPK(context)}#SETTINGS`;

        const checkPermissions = (): Promise<CmsSettingsPermissionType> => {
            return utils.checkPermissions(context, "cms.settings");
        };

        const settings: CmsSettingsContextType = {
            contentModelLastChange: new Date(),
            get: async (): Promise<CmsSettingsType | null> => {
                await checkPermissions();

                const [[settings]] = await db.read<CmsSettingsType>({
                    ...utils.defaults.db,
                    query: { PK: PK_SETTINGS(), SK: SETTINGS_SECONDARY_KEY }
                });

                return settings;
            },
            install: async (): Promise<CmsSettingsType> => {
                const settings = await context.cms.settings.get();
                if (!!settings?.isInstalled) {
                    throw new Error("The app is already installed.", "CMS_INSTALLATION_ERROR");
                }

                // then add default content model group
                const contentModel = await context.cms.groups.create(initialContentModelGroup);

                const model: CmsSettingsType = {
                    isInstalled: true,
                    contentModelLastChange: contentModel.savedOn
                };

                // this will store the initial timestamp which is then used to determine if CMS Schema was changed.
                context.cms.settings.contentModelLastChange = contentModel.savedOn;

                // mark as installed in settings
                await db.create({
                    ...utils.defaults.db,
                    data: {
                        PK: PK_SETTINGS(),
                        SK: SETTINGS_SECONDARY_KEY,
                        TYPE: DbItemTypes.CMS_SETTINGS,
                        ...model
                    }
                });
                return model;
            },
            updateContentModelLastChange: async (): Promise<CmsSettingsType> => {
                const updatedDate = new Date();

                await db.update({
                    ...utils.defaults.db,
                    query: {
                        PK: PK_SETTINGS(),
                        SK: SETTINGS_SECONDARY_KEY
                    },
                    data: {
                        lastContentModelChange: updatedDate
                    }
                });

                context.cms.settings.contentModelLastChange = updatedDate;

                return {
                    isInstalled: true,
                    contentModelLastChange: updatedDate
                };
            },
            getContentModelLastChange: (): Date => {
                return context.cms.settings.contentModelLastChange;
            }
        };
        context.cms = {
            ...(context.cms || ({} as any)),
            settings
        };
    }
} as ContextPlugin<CmsContext>;