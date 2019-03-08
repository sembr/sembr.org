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
          add_word_break_opportunity!(content)
          wrap_rfc2119_keywords!(content)

          super(content)
        end

        private

        def add_word_break_opportunity!(markdown)
          markdown.sub!(/^\#\s+(Semantic Line Breaks)\s+$/, '# Semantic Line&nbsp;Breaks')
        end

        def wrap_rfc2119_keywords!(markdown)
          markdown.gsub!(/(#{KEYWORDS.join('|')})/, '<mark>\1</mark>')
        end
      end
    end
  end
end
