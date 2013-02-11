FactoryGirl.define do
  factory :user do
    firstname             "Appr"
    lastname              "Entice"
    email                 "apprentice@logenhelfer.de"
    password              "foobar123"
    password_confirmation "foobar123"
    matriculation_number  123
    date_of_birth         50.year.ago
  end

  factory :role do
    # everything will be done controller_macros.rb
  end

end
