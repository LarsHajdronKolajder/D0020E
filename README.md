# Demand-Supply Matching (DSM) service

This is part of a [project course](https://www.ltu.se/edu/course/D00/D0020E/D0020E-Projekt-i-datateknik-1.112677?kursView=kursplan&l=en) in Computer Science for students in their third year at Luleå tekniska universitet.

## The project
The project revolves around a Demand-Supply Matching service.

## Group members
[Ludvig Järvi](https://github.com/Jaevii)  
[Anton Follinger](https://github.com/Hundmat)   
[Daniel Hammar](https://github.com/DanielHammar)   
[Martin Höglund](https://github.com/LarsHajdronKolajder)  

## Git-Workflow


## Code Format
We are programming in X, therefore we agreed on a standard code format:  
- Example 1
- Example 2

# RBAC

Our RBAC system is built on top of an existing RBAC system, which couldn't be modified. This led to the development of our system, featuring a simplified visual frontend. While the frontend was simple, the backend was especially developt to seamlessly integrate with the pre-existing RBAC system, ensuring that the vital controls and checks will work.



### MongoDB

User login credentials will be securely stored in MongoDB. Initially, certain information will only be modifiable through direct database access, such as role and seller.

#### Database information for RBAC:

- `username`: Represents the account holder's username on the website.
- `password`: Encrypted password used for account authentication.
- `role`: Defines the user's role, with options including sel for sellers, dev for developers, and bro for brokers.
- - `sel`: This is the role for accounts that can sell.
  - `dev`: This is just a developer account.
  - `bro`: This is the role of a broker that let you sell for other accounts
- `seller`: Specific to broker accounts, indicating the sellers they are authorized to represent.

#### Example
![Example](https://github.com/LarsHajdronKolajder/D0020E/blob/dev/README_image/exampledb.png)

## Guidelines for Utilizing the Login System

### Login and Signup
When the user access the `new offer` page they will have to fill out the `BatteryID`, when this is done and the user press _Hämta API_ (fetch API) they will be promted with the login system. Where inputs are seperated with `:`

#### Login
![login](https://github.com/LarsHajdronKolajder/D0020E/blob/dev/README_image/loginprompt.png)
- `login`: Represents the command that log the user into the account.
- `username`: Represents the account holder's username on the website.
- `password`: Pssword used for account authentication.

#### Signup
![signup](https://github.com/LarsHajdronKolajder/D0020E/blob/dev/README_image/signup.png)
- `signup`: Represents the command that create an account.
- `username`: Represents the new accounts username on the website.
- `password`: Pssword used for account authentication.

#### Limitations
To enable users to create an offer, they must log into an account with the necessary selling rights. Additionally, users must provide the site with a `BatteryID` that they own. If the `BatteryID` does not exist in the database, it will be created and linked to the logged-in user's account.
