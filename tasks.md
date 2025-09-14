Task1:
I have now working frontend and backend of this app in the folders
1. kisaan-backend-node
2. kisaan-frontend

all others are either obselete or supporting. I want to deploy the app in azure with very lowcost and frontend on github pages. But on my machine to tun frontend I have to run nprm run dev so that app is running at the localhost endpoint. how can i do that in githubpagesor is it possible to achive this using github pages

Task2:
In the terraform folder you can find the terraform code to create the infra to deploy this app in azure. Can you verify the workflows in the .github/workflows folder such that everything is still relevant to deploy becasue now this is a nodejs app instead of python app and the relevant folders are 1. kisaan-backend-node
2. kisaan-frontend

Task3:
Whenever i push to main branch then pipeline should get triggered and deploy the latest changes to azure production environment. what is missing for that and can you fix that.