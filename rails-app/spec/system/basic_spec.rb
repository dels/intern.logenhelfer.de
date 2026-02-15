require 'rails_helper'

RSpec.describe "Basic", type: :system do
  it "shows the login page" do
    visit root_path
    expect(page).to have_content("Bitte loggen Sie sich ein:")
  end
end
