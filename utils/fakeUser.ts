import { faker } from "@faker-js/faker";

export interface FakeUser {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  city: string;
  country: string;
}

export function generateFakeUser(): FakeUser {
  return {
    fullName: faker.person.fullName(),
    email: faker.internet.email(),
    password: faker.internet.password({ length: 12 }),
    phone: "+91-" + faker.phone.number({ style: "national" }),
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    country: faker.location.country(),
  };
}
