require 'test_helper'

class UserTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end

  test "mandatory fields" do

    u = User.new 
    u.email = 'test@test.de'
    u.password = 'emptypassword'
    u.firstname = 'vorname'
    u.lastname = 'nachname'
    u.date_of_birth = '02.02.2002'
    u.matriculation_number = 999

    assert(u.save, "user with all mandatory fields should have been saved")
    assert(u.destroy, "should have desctroyed the user")
  end

  test "duplicate e-mail" do 
    u1 = User.new 
    u1.email = 'test@test.de'
    u1.password = 'emptypassword'
    u1.firstname = 'vorname'
    u1.lastname = 'nachname'
    u1.date_of_birth = '02.02.2002'
    u1.matriculation_number = 999
    assert(u1.save, "user with unique mail address should have been saved")
 
    u2 = User.new 
    u2.email = 'test@test.de'
    u2.password = 'emptypassword'
    u2.firstname = 'vorname'
    u2.lastname = 'nachname'
    u2.date_of_birth = '02.02.2002'
    u2.matriculation_number = 999
    assert(false == u2.save, "e-mail address currently already exists should not have been saved")

    assert(u1.destroy, "should have destroyed the user")
  end

end
