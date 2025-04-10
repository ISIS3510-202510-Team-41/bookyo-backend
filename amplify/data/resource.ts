import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  Wishlist: a.model({
    id: a.id().required(),
    userId: a.string().required(),
    user: a.belongsTo("User", "userId"),
    books: a.hasMany("BookWishlist", "wishlistId")
  }).authorization(allow => [
    allow.authenticated().to(['read']),
    allow.owner().to(['create', 'update', 'delete'])
  ]),

  BookWishlist: a.model({
    bookId: a.id(),
    wishlistId: a.id().required(),
    book: a.belongsTo("Book", "bookId"),
    list: a.belongsTo("Wishlist", "wishlistId")
  }).authorization(allow => [
    allow.authenticated().to(['read']),
    allow.owner().to(['create', 'update', 'delete'])
  ]),

  Book: a.model({
    id: a.id().required(),
    title: a.string().required(),
    isbn: a.string().required(),
    thumbnail: a.string(),
    authorId: a.string().required(),
    author: a.belongsTo("Author", "authorId"),
    categories: a.hasMany("BookCategory", "bookId"),
    ratings: a.hasMany("BookRating", "bookId"),
    listings: a.hasMany("Listing", "bookId"),
    wishlists: a.hasMany("BookWishlist", "bookId"),
    libraries: a.hasMany("BookLibrary", "bookId")
  }).authorization(allow => [
    allow.authenticated().to(['read']),
    allow.owner().to(['create', 'update', 'delete'])
  ]).secondaryIndexes((index) => [index("isbn")]),

  UserLibrary: a.model({
    id: a.id().required(),
    userId: a.string().required(),
    user: a.belongsTo("User", "userId"),
    books: a.hasMany("BookLibrary", "libraryId"),
  }).authorization(allow => [
    allow.authenticated().to(['read']),
    allow.owner().to(['create', 'update', 'delete'])
  ]),

  BookLibrary: a.model({
    bookId: a.id(),
    libraryId: a.id().required(),
    book: a.belongsTo("Book", "bookId"),
    userLibraryRef: a.belongsTo("UserLibrary", "libraryId") // Cambio realizado aquí
  }).authorization(allow => [
    allow.authenticated().to(['read']),
    allow.owner().to(['create', 'update', 'delete'])
  ]),

  BookCategory: a.model({
    categoryId: a.string(),
    bookId: a.string().required(),
    category: a.belongsTo("Category", "categoryId"),
    book: a.belongsTo("Book", "bookId"),
  }).authorization(allow => [
    allow.authenticated().to(['read']),
    allow.owner().to(['create', 'update', 'delete'])
  ]),
  Author: a.model({
    id: a.id().required(),
    name: a.string().required(),
    books: a.hasMany("Book", "authorId"),
  }).authorization(allow => [
    allow.authenticated().to(['read']),
    allow.owner().to(['create', 'update', 'delete'])
  ]),

  User: a.model({
    email: a.string().required(),
    firstName: a.string(),
    lastName: a.string(),
    address: a.string(),
    phone: a.string(),
    userLibraryRef: a.hasOne("UserLibrary", "userId"),
    ratingsReceived: a.hasMany("UserRating", "ratedId"),
    ratings: a.hasMany("UserRating", "userId"),
    listings: a.hasMany("Listing", "userId"),
    wishlist: a.hasOne("Wishlist", "userId"),
    cart: a.hasOne("Cart", "userId")
  }).authorization(allow => [
    allow.authenticated().to(['read']),
    allow.owner().to(['create', 'update', 'delete'])
  ]).identifier(["email"]),

  UserRating: a.model({
    id: a.id().required(),
    userId: a.string().required(),
    user: a.belongsTo("User", "userId"),
    ratedId: a.string().required(),
    ratedUser: a.belongsTo("User", "ratedId"),
    rating: a.integer().required(),
    description: a.string(),
  }).authorization(allow => [
    allow.authenticated().to(['read']),
    allow.owner().to(['create', 'update', 'delete'])
  ]),
  Category: a.model({
    id: a.id().required(),
    name: a.string().required(),
    books: a.hasMany("BookCategory", "categoryId"),
  }).authorization(allow => [
    allow.authenticated().to(['read']),
    allow.owner().to(['create', 'update', 'delete'])
  ]),

  BookRating: a.model({
    id: a.id().required(),
    bookId: a.string().required(),
    book: a.belongsTo("Book", "bookId"),
    rating: a.integer().required(),
    description: a.string(),
  }).authorization(allow => [
    allow.authenticated().to(['read']),
    allow.owner().to(['create', 'update', 'delete'])
  ]),

  Listing: a.model({
    id: a.id().required(),
    bookId: a.string().required(),
    book: a.belongsTo("Book", "bookId"),
    userId: a.string().required(),
    user: a.belongsTo("User", "userId"),
    price: a.float().required(),
    status: a.enum(["available", "unavailable", "sold"]),
    photos: a.string().array().required(),
    cartId: a.id(),
    cart: a.belongsTo("Cart", "cartId")
  }).authorization(allow => [
    allow.authenticated().to(['read']),
    allow.owner().to(['create', 'update', 'delete'])
  ]),
  Notification: a.model({
    id: a.id().required(),
    title: a.string().required(),
    body: a.string().required(),
    recipient: a.string().required(),
    read: a.boolean().required(),
    type: a.enum(["NEW_BOOK", "BOOK_SOLD", "SYSTEM_NOTIFICATION"]),
  }).authorization(allow => [allow.authenticated().to(['read', 'create', 'delete'])]),
  Cart: a.model({
    id: a.id().required(),
    userId: a.string().required(),
    user: a.belongsTo("User", "userId"),
    listings: a.hasMany("Listing", "cartId"),
    state: a.enum(["active", "completed", "shipping"]),
  }).authorization(allow => [
    allow.authenticated().to(['read']),
    allow.owner().to(['create', 'update', 'delete'])
  ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});