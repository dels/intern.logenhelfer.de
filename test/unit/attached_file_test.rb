require 'test_helper'

class AttachedFileTest < ActiveSupport::TestCase
  def test_should_be_valid
    assert AttachedFile.new.valid?
  end
end
