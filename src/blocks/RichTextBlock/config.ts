import type { Block } from 'payload'

import {
  BlockquoteFeature,
  BoldFeature,
  ChecklistFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  IndentFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  StrikethroughFeature,
  UnderlineFeature,
  UnorderedListFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export const RichTextBlock: Block = {
  slug: 'richTextBlock',
  interfaceName: 'RichTextBlockType',
  labels: {
    plural: 'Rich Text Blocks',
    singular: 'Rich Text',
  },
  fields: [
    {
      name: 'content',
      type: 'richText',
      required: true,
      editor: lexicalEditor({
        features: [
          ParagraphFeature(),
          HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }),
          BoldFeature(),
          ItalicFeature(),
          UnderlineFeature(),
          StrikethroughFeature(),
          UnorderedListFeature(),
          OrderedListFeature(),
          ChecklistFeature(),
          IndentFeature(),
          BlockquoteFeature(),
          HorizontalRuleFeature(),
          LinkFeature({
            enabledCollections: ['pages', 'projects', 'works'],
          }),
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ],
      }),
    },
  ],
}
