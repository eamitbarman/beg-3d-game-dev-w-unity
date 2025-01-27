var customSkin : GUISkin; 
var customGUIStyle : GUIStyle; // override the skin  
var boxStyleLabel : GUIStyle; // make a label that looks like a box  

var defaultCursor : Texture; // load in the texture for the default cursor
private var currentCursor : Texture; // the current texture on the cursor
private var showMOCursorChange : boolean; //flag for changing the cursor color
private var showPointer : boolean; // flag for pointer visibility 
private var iMode = false; // flag for whether inventory mode is off or on

private var navigating : boolean;   // flag for navigation state
var mouseOverColor = Color.green;  
var mouseOverMaterial : Material;
var useMOCursorChange : boolean = true;
var useIconColorChange = true;
var useMOMaterialChange : boolean = false;
var useText : boolean = true; // flag to suppress or allow all text
var showText : boolean= false; // flag to toggle text during play
var useLongDesc : boolean = true;
private var showShortDesc : boolean = true; 
private var showLongDesc : boolean = true;
private var showActionMsg : boolean = false; 
private var shortDesc : String = "";
private var longDesc : String = "";
private var actionMsg : String = ""; 
private var inRange : boolean; // distance flag for long desc
private var resetMO : boolean = false; // flag to reset mouseover after pick  
private var actionObject : String; // the name of the last action object to turn on the actionMsg 
private var gridPosition: int = 0; // the default position of the inventory grid
private var iLength : int; // length of the array of inventory objects 
private var replaceElement : int; // var to store the current inventory object's element  

//sound volumes
var soundFXVolume : float = 1.0; // sound effects volume
var ambientSoundVolume : float = 1.0; // ambient background sounds volume
var backgroundMusicVolume : float = 1.0; // so we don�t have to force our music on the player
var voiceVolume : float = 1.0; // in case we have character voices

//Dynamic array of objects currently in inventory
private var currentInventoryObjects = new Array(); 

// inventory layout
private var startPos = 140;
private var iconSize = 90; 




function Awake () {

   Screen.SetResolution (1024, 768, false);

}

function Start () {

   Screen.showCursor = false; // hide the os cursor
   
  showPointer = true; // enable the pointer at start up
  currentCursor = defaultCursor; 
  
    var element = 0; // initialize a counter 
	var iObjects = GameObject.FindGameObjectsWithTag ("InventoryObject");  

	// go through the scene and put the tagged objects in the array
	for (var iObject in iObjects) {

	   //only if its current state is 1 ( in inventory)
	   if(iObject.GetComponent(Interactor).initialState == 1) {
	   //print (iObject.name);
	   currentInventoryObjects.Add(iObject);
	   iObject.GetComponent(Interactor).iElement = element; // assign the element number to the current object
	   element ++; //increment the element 
	   }
	} 

	iLength = currentInventoryObjects.length; 
	InventoryGrid(); // arrange the inventory icons

}


function Update () {

   if (Input.GetButton("ML Enable") || Input.GetButton("Horizontal") || 
      Input.GetButton("Vertical") || Input.GetButton("Turn")){
      navigating = true;
   }
   else {
      navigating = false;
   }
} 



function OnGUI () {

   GUI.skin = customSkin;
	
   if (useText){  //global toggle
      if (showActionMsg) GUI.Label (Rect (Screen.width/2 - 300, Screen.height - 47, 600, 35), actionMsg);
      if (showText && !showActionMsg){ //local toggle
         if (useLongDesc) {
         if (showLongDesc && inRange) GUI.Label (Rect (Screen.width/2 - 250, Screen.height - 37, 500,35), longDesc);
        }
        if (showShortDesc) GUI.Label (Rect (Screen.width/2 - 250, Screen.height - 65, 500,35), shortDesc, customGUIStyle);
     }
   }

//~ if (GUI.Button (Rect(5,Screen.height - 35,32,32),"i")) {
//~ // call the Toggle Mode function when this button is picked
  //~ GameObject.Find("Camera Inventory").SendMessage("ToggleMode");
//~ } 

   //reset mouseovers 
   if (resetMO) GUI.Box (Rect (0, 0, Screen.width,Screen.height),"",customGUIStyle);
   
	 if (showPointer && !navigating) {

	   var pos = Input.mousePosition; //get the location of the cursor
	   if(useMOCursorChange && showMOCursorChange ) GUI.color = mouseOverColor;  
	   else GUI.color = Color.white;
	   GUI.DrawTexture (Rect(pos.x, Screen.height - pos.y, 64,64), currentCursor);

	} 
  
}




function ResetMouseOver () { 

	yield new WaitForSeconds(0.5);
	resetMO = true;
	yield;
	resetMO = false;

}


function ResetCursor() {
   currentCursor = defaultCursor; // reset the cursor to the default
}


function AddToInventory (object : GameObject) {

   //print ("adding " + object.name + " to inventory");
   // add the new object to the current inventory array
	currentInventoryObjects.Add(object); 
	
	// update the object's inventory number
	object.GetComponent(Interactor).iElement = currentInventoryObjects.length-1; 
	iLength = currentInventoryObjects.length;// update array length 
	
	//Update the grid
	InventoryGrid(); 
	
	if (iLength > 9) {
		// shift the grid to the right until you get to the end where the new object was added
		while (gridPosition * 3 + 9 < iLength) 
		GameObject.Find("ArrowLeft").SendMessage("ShiftGrid", "left"); 
	} 


}

function RemoveFromInventory (object : GameObject) {

   //print ("removing" + object.name + "  from inventory");
   
	// retrieve its inventory element number
	var iElement = object.GetComponent(Interactor).iElement; 
	//remove that element from the currentInventoryObjects array
	currentInventoryObjects.RemoveAt(iElement);
	iLength = currentInventoryObjects.length;// update array length
	
	//if the third column is empty, shift the grid to the right
	if(gridPosition * 3 + 6 >= iLength  && iLength>= 9) 
	GameObject.Find("ArrowRight").SendMessage("ShiftGrid", "right"); 

	//update the element number for items past the removal point
	for (var x = iElement; x < iLength; x++){
	   currentInventoryObjects[x].GetComponent(Interactor).iElement = x;
	} 
	
	yield;//pause a frame to make sure the update doesn't start until renumbering is done
	
	// update the grid
	InventoryGrid(); 

}


// arrange icons in inventory
function InventoryGrid () {

	var visibility: boolean; // variable for column visibility 

	var xPos = -startPos - iconSize/2;  // adjust column offset start position according to icon 
	var spacer = startPos - iconSize; // calculate the spacer size  

	var iLength = currentInventoryObjects.length; // length of the array 

	for (var k = 0; k < iLength; k = k + 3) { 

		//calculate the column visibility for the top element, k, using the or, ||
		if (k < gridPosition * 3 || k > gridPosition * 3 + 8) visibility = false;
		else visibility = true; // else it was on the grid 
		
		// if elements need to be hidden, do so before positioning
		if (!visibility) HideColumn(k); // send the top row element for processing 

		//row 1
		var yPos = startPos - iconSize/2;
		currentInventoryObjects[k].guiTexture.pixelInset = Rect(xPos, yPos, iconSize,iconSize); 

		//row 2
		yPos = yPos - iconSize - spacer;
		if (k + 1 < iLength) 
		   currentInventoryObjects[k+1].guiTexture.pixelInset = Rect(xPos, yPos, iconSize,iconSize); 

		//row 3
		yPos = yPos - iconSize - spacer;
		if (k + 2 < iLength) 
		   currentInventoryObjects[k+2].guiTexture.pixelInset = Rect(xPos, yPos, iconSize,iconSize); 

		// if elements need to be shown, do so after positioning
		if (visibility) ShowColumn(k); // send the top row element for processing 

		xPos = xPos + iconSize + spacer;  // update column position for the next group

	} // close for loop 


	//if there are arrows to the left of the grid, activate the right arrow
	if (gridPosition > 0) GameObject.Find("ArrowRight").SendMessage("ArrowState", true);
	else GameObject.Find("ArrowRight").SendMessage("ArrowState", false); 

	//if there are arrows to the right of the grid, activate the left arrow
	if (iLength > gridPosition * 3 + 9) 
	  GameObject.Find("ArrowLeft").SendMessage("ArrowState", true);
	else GameObject.Find("ArrowLeft").SendMessage("ArrowState", false); 

} // close the function 


function ShowColumn ( topElement : int) {
	if (topElement >= iLength) return; // there are no icons in the column, return 
   // show the elements in the 3 rows for the top element's column
   currentInventoryObjects[topElement].guiTexture.enabled = true; // row 1 element
   if (topElement + 1 < iLength) 
         currentInventoryObjects[topElement + 1].guiTexture.enabled = true; // row 2 
   if (topElement + 2 < iLength) 
         currentInventoryObjects[topElement + 2].guiTexture.enabled = true; // row 3 
} 

function HideColumn ( topElement : int) {
	if (topElement >= iLength) return; // there are no icons in the column, return 
   // hide the elements in the 3 rows for the top element's column
   currentInventoryObjects[topElement].guiTexture.enabled = false; // row 1 element
   if (topElement + 1 < iLength) 
         currentInventoryObjects[topElement + 1].guiTexture.enabled = false; // row 2 
   if (topElement + 2 < iLength) 
         currentInventoryObjects[topElement + 2].guiTexture.enabled = false; // row 3 
} 






