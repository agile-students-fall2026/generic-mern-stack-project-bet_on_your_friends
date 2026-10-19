# Bet on Your Friends UX Design

**Bet on Your Friends** is a web app where friends make predictions about each other's lives and bet virtual coins on the outcomes.

## Wireframes

[Here](https://www.figma.com/design/swvxz89hm5fBcoFZp1cMPC/bet-on-your-friends?node-id=6-283&t=JWvmNmBGUGidtrnL-1) is the link to our wireframes.

Editable SVG files and PNG exports for the added screens are in [ux-design](ux-design/).

## Prototype

[Clickable prototype](https://www.figma.com/proto/swvxz89hm5fBcoFZp1cMPC/bet-on-your-friends?node-id=65-2&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=65%3A2). Anyone with the link can view it. Flow 1 starts at Login; Flow 2 starts with a group invitation.

## App Map



## Work Split

- **Sufyan Waryah** ([sufyanw](https://github.com/sufyanw))
- **Alisha Zaman** ([az2924](https://github.com/az2924)): Created wireframes for My Groups, Group: Resolved Predictions, Prediction Detail (Bettor View, Not Enough Coins, Already Bet, Creator View), Create Prediction (and Errors), and Profile; Created the app map for those screens; Created a template in `UX-DESIGN.md` for everyone to utilize
- **Vihaan Agarwal** ([VihaanAgarwal](https://github.com/VihaanAgarwal)): Created wireframes for Login, Join Group, Open and All Predictions, Group Members, Leave Group confirmation, My Groups after leaving, Edit Prediction, and Final Outcome. Connected prototype flows for stories #15–26 using the existing team screens.
- **Nihal Sundari** ([NISUN05](https://github.com/NISUN05)): Created wireframes for Leaderboard; Activity (Bets View, Predictions View); and Prediction Post-Bet Interactions (Confirm Bet Modal, Delete Confirmation Modal, Comment Draft & Posted Thread, Bettor Breakdown for Yes/No Bettors); Created the app map for those screens.

## App Map



---

### Groups

#### My Groups

Lists the user's groups after they log in.

<a href="ux-design/my-groups-returning-user.png"><img src="ux-design/my-groups-returning-user.png" width="375"></a>

#### Join Group

Shows an invitation. Join Group adds the group to My Groups; Decline returns without joining.

<a href="ux-design/join-group.png"><img src="ux-design/join-group.png" width="375"></a>

#### Group: All Predictions

Lists open and resolved predictions. The tabs filter the list; the member count opens Group Members.

<a href="ux-design/group-all-predictions.png"><img src="ux-design/group-all-predictions.png" width="375"></a>

#### Group: Open Predictions

Lists predictions that are still open for bets. Tapping a prediction opens its details.

<a href="ux-design/group-open-predictions.png"><img src="ux-design/group-open-predictions.png" width="375"></a>

#### Group: Resolved Predictions

Shows a group's finished predictions and their results. The badge shows whether the user won coins, lost coins, or didn't bet.

<a href="ux-design/resolved-groups.png"><img src="ux-design/resolved-groups.png" width="375"></a>

#### Group Members

Lists the group's members and provides the Leave Group action.

<a href="ux-design/group-members.png"><img src="ux-design/group-members.png" width="375"></a>

#### Leave Group Confirmation

Cancel returns to Group Members. Leave Group removes the group from My Groups.

<a href="ux-design/leave-group-confirmation.png"><img src="ux-design/leave-group-confirmation.png" width="375"></a>

#### My Groups: After Leaving

Shows the remaining groups after leaving NYU Roommates. A new invitation allows the user to rejoin.

<a href="ux-design/my-groups-after-leaving.png"><img src="ux-design/my-groups-after-leaving.png" width="375"></a>

---

### Predictions

#### Prediction Detail: Bettor View

Lets a group member pick an outcome and place a bet. Each outcome shows how many coins have been bet on it.

<a href="ux-design/prediction-detail-bettor.png"><img src="ux-design/prediction-detail-bettor.png" width="375"></a>

#### Prediction Detail: Not Enough Coins

Shown when the user enters more coins than they have. Place Bet stays disabled until the amount is valid.

<a href="ux-design/prediction-detail-insufficient-coins.png"><img src="ux-design/prediction-detail-insufficient-coins.png" width="375"></a>

#### Prediction Detail: Already Bet

Shown after the user has bet. Users can only bet once per prediction, so the bet form is replaced with their bet.

<a href="ux-design/prediction-details.png"><img src="ux-design/prediction-details.png" width="375"></a>

#### Prediction Detail: Creator View

Creators can't bet on their own predictions. Edit and Delete Prediction only appear until someone places a bet.

<a href="ux-design/prediction-detail-creator.png"><img src="ux-design/prediction-detail-creator.png" width="375"></a>

#### Create Prediction

Form for posting a new prediction with a question, at least two outcomes, and a betting deadline. Bets close at the deadline.

<a href="ux-design/create-prediction.png"><img src="ux-design/create-prediction.png" width="375"></a>

#### Create Prediction: Errors

Shown when Post Prediction is tapped without a question or at least two outcomes.

<a href="ux-design/create-prediction-requirements.png"><img src="ux-design/create-prediction-requirements.png" width="375"></a>

#### Edit Prediction

Lets the creator edit the question, outcomes, and deadline before anyone bets. Save Changes returns to the prediction; Cancel discards edits.

<a href="ux-design/edit-prediction.png"><img src="ux-design/edit-prediction.png" width="375"></a>

#### Prediction: Final Outcome

Shows the creator the final outcome of a resolved prediction. Resolved predictions cannot be edited.

<a href="ux-design/prediction-final-outcome.png"><img src="ux-design/prediction-final-outcome.png" width="375"></a>

#### Prediction Action: Bet Confirmation Modal

Shows a confirmation modal when a user attempts to place a bet, summarizing the selection and warning that wagers cannot be undone.

<a href="ux-design/bet-confirmation-modal.png"><img src="ux-design/bet-confirmation-modal.png" width="375"></a>

#### Prediction Action: Prediction Deletion Confirmation Modal

Shows a warning confirmation modal when a creator attempts to permanently delete an unbet-on prediction.

<a href="ux-design/prediction-deletion-confirmation-modal.png"><img src="ux-design/prediction-deletion-confirmation-modal.png" width="375"></a>

#### Prediction Action: Draft Comment 

Provides a text draft box with character limits for adding the first comment to a prediction before posting.

<a href="ux-design/draft-comment.png"><img src="ux-design/draft-comment.png" width="375"></a>

#### Prediction Action: Draft First Comment

Provides a text draft box with character limits for adding the first comment to a prediction before posting.

<a href="ux-design/draft-first-comment.png"><img src="ux-design/draft-first-comment.png" width="375"></a>

#### Prediction Action: Comments Thread

Displays posted comments from group members under a prediction, along with an inline input box to add further comments.

<a href="ux-design/comments-thread.png"><img src="ux-design/comments-thread.png" width="375"></a>

#### Prediction Audit: Bettor Breakdown (Yes Bettors)

Lists all group members who placed a bet on "Yes," showing individual coin stakes and timestamp details.

<a href="ux-design/Yes-Bettors-List.png"><img src="ux-design/Yes-Bettors-List.png" width="375"></a>

#### Prediction Audit: Bettor Breakdown (No Bettors)

Lists all group members who placed a bet on "No," showing individual coin stakes and timestamp details.

<a href="ux-design/No-Betters-List.png"><img src="ux-design/No-Betters-List.png" width="375"></a>

---

### Account

#### Login

Lets a returning user log in and open My Groups.

<a href="ux-design/login.png"><img src="ux-design/login.png" width="375"></a>

#### Profile

Lets the user change the display name friends see in groups and on the leaderboard, or log out.

<a href="ux-design/change-set-display-name.png"><img src="ux-design/change-set-display-name.png" width="375"></a>

---

### Leaderboard

#### Leaderboard

Ranks group members by their available virtual coin balances from highest to lowest.

<a href="ux-design/Leaderboard.png"><img src="ux-design/Leaderboard.png" width="375"></a>

---

### Activity 

#### Recent Activity: Bets

Displays a log of the user's placed bets and settled bet results across predictions.

<a href="ux-design/recent-activity-bets-view.png"><img src="ux-design/recent-activity-bets-view.png" width="375"></a>

#### Recent Activity: Predictions

Displays a log of predictions created by the user along with their current status and resolution timelines.

<a href="ux-design/recent activity-predictions-view.png"><img src="ux-design/recent activity-predictions-view.png" width="375"></a>
