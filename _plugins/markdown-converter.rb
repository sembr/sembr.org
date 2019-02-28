# frozen_string_literal: true

require 'jekyll'
require 'jekyll-commonmark'

KEYWORDS = [
  'MUST', 'MUST NOT', 'REQUIRED', 'SHALL', 'SHALL NOT',
  'SHOULD', 'SHOULD NOT', 'RECOMMENDED', 'MAY', 'OPTIONAL'
].sort_by(&:length).reverse

module Jekyll
  module Converters
    class Markdown
      class ExtendedCommonMark < CommonMark
        def convert(content)
          wrap_rfc2119_keywords!(content)

          super(content)
        end

        private

        def wrap_rfc2119_keywords!(markdown)
          markdown.gsub!(/(#{KEYWORDS.join('|')})/, '<mark>\1</mark>')
        end
      end
  end
  end
end
