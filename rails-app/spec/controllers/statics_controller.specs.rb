#require File.dirname(__FILE__) + '/../spec_helper'

require 'spec_helper'

describe StaticsController do
  include Devise::TestHelpers
  
  it "should get index" do
    # Note, rails 3.x scaffolding may add lines like get :index, {}, valid_session
    # the valid_session overrides the devise login. Remove the valid_session from your specs
    get 'index'
    response.should be_success
  end

  it "should get imprint" do
    # Note, rails 3.x scaffolding may add lines like get :index, {}, valid_session
    # the valid_session overrides the devise login. Remove the valid_session from your specs
    get 'impressum'
    response.should be_success
  end
end
