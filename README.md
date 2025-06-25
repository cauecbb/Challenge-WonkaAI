# Invoice Processing Assignment

**Note:** This assignment was created based on a real-life project at Wonka.AI. The invoices used are dummy/fake.

## 🚨 IMPORTANT DATABASE SETUP REQUIREMENT 🚨

**MANDATORY**: Before starting, you MUST personalize your database name in the `docker-compose.yml` file.

Replace `POSTGRES_DB: meetwonka_db` with `POSTGRES_DB: meetwonka_{your_first_name}_{your_last_name}`

**Example**: If your name is John Smith, use `POSTGRES_DB: meetwonka_john_smith`

⚠️ **This is a critical requirement and your submission will not be accepted without this personalization.**

## Assignment Overview

You are a consultant at Superstore, which is an IT wholesaler selling IT products on the market to clients. The issue is that, at the moment, all invoices are paper-based and stored in their hangar.

With the AI boom and its ability to read text from images, Superstore came to us (Wonka.AI) to create a solution that would permit them to have all their archives scanned and grouped in an app. All invoices have already been scanned and can be found in the folder `/backend/data/scanned-invoices`.

Because they are so nice, and the boss is trying to learn React.JS, you already have a working frontend at hand! Unfortunately, vibe coding has its cons, so there may be errors in the code, sorry about that!

## What's Already Provided

- **Frontend Application**: A React.JS application located in `/invoice-processing/`
- **Database Setup**: PostgreSQL database with pre-configured tables (see `/backend/README.md` for schema details)
- **Scanned Invoices**: Sample invoices in `/backend/data/scanned-invoices/`
- **Docker Configuration**: Database setup via Docker Compose in `/backend/`

### Resources

Here are some resources you can use. It is not mandatory to use them.

Azure Cognitive Search :
- Endpoint: https://djiby-service.search.windows.net
- key : Nv9zY536IMexMTlQIR9cLI9zP4YGrMMQMYpUOJrD86AzSeDZcUOy

Azure Document intelligence :
- Endpoint: https://di-documentsinsertion-dev-westeu-01.cognitiveservices.azure.com/
- Key : 7rm7jkKluSvypX5NNj5cKQPuJgiltf18zStQQu0zJJJ4OGK6BodxJQQJ99BCACYeBjFXJ3w3AAALACOGULv1

OpenAI :
- Endpoint: https://djiby.services.ai.azure.com/
- Key : ffdf90c0863343379a82126d5d6d1992
- Model : gpt-4.1
- Model name : gpt-4.1

The keys will be depecrated as soon as you are done with the assignment.

## Your Role & Deliverables

Your role in this project is to create the **backend of the application**. You must:

1. Be able to store invoices in the provided PostgreSQL database
2. Create API endpoints that the frontend can consume
3. Handle invoice data extraction and checking
4. Implement proper validation for all incoming data

## Getting Started

1. **Set up the database**:
   
   **FIRST**: Edit `backend/docker-compose.yml` and replace the database name:
   ```yaml
   POSTGRES_DB: meetwonka_{your_first_name}_{your_last_name}
   ```

2. **Launch and analyze the frontend**:
   - Review `/invoice-processing/src/` to understand expected API contracts
   - Look at the service files to see what endpoints are expected

## Time Constraints & Expectations

**Time Limit**: 4 hours to create the backend

**However**, if you finish earlier, it's all to your advantage to add features that you feel are necessary for the end result of this app.

## Important Notes

### AI Usage Policy
It's 2025, you are allowed to freely use AI to work on this project. In fact, we even advise you to use it! It's like a new IDE that makes you work faster, unless you are not able to keep control of this tool. On the other hand, it is on our side to be able to evaluate you in other ways than just "Oh, the code works, good job!". Hence, we must tell you in advance that we will grade you on the code quality.

**Remember**: While AI is all fun and games, you must keep in mind that it is never 100%. Fact-checking its results is a necessity in all production environments!

### Flexibility
You are free to modify the frontend and the database if you feel like there is a better way to implement it. Just document your changes and reasoning.

## Submission Guidelines

1. **Code**: Complete backend implementation
2. **Documentation**: 
   - API documentation (Swagger/OpenAPI preferred)
   - Setup instructions in `/backend/README.md`
   - Any architectural decisions or changes made
3. **Demo**: Be prepared to demonstrate your solution

## Message from Your Project Manager

I present myself, my name is Willy (Wonka), I'm your Project Manager on this project. Unfortunately, I have no time to work on this, I have 1000 chocolate bars to wrap for Flanders AI... Here is a speech before you start on this project:

The points above are your technical requirements, but remember: this is as much about demonstrating your problem-solving approach and code quality as it is about getting things working. Show us how you think, how you structure your code, and how you would approach this in a real production environment.

Good luck, and remember our company motto:

**Work less, vibe more!**
