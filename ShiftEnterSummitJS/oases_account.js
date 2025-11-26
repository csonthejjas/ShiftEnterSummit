function onLoad(executionContext) {
	// Call the function to manage section visibility on form load
	manageSectionsBasedOnMultiSelect(executionContext);
}

function onShowPCFChange(executionContext) {
	// Call the function to manage section visibility when the multi-select option set changes
	manageSectionsBasedOnMultiSelect(executionContext);
}

function manageSectionsBasedOnMultiSelect(executionContext) {
	const formContext = executionContext.getFormContext();
	// Get selected values from the multi-select option set
	const selectedValues = formContext.getAttribute('oases_show_pcf').getValue() || [];

	// Hide or show sections based on selected values
	Object.entries(SECTION_MAP).forEach(([key, sectionName]) => {
		// Check if the current optionset value is selected
		const isSelected = selectedValues.includes(+key); // plus sign converts string key to number
		// Show or hide the section accordingly
		formContext.ui.tabs.get('SUMMARY_TAB').sections.get(sectionName).setVisible(isSelected);
	});
}

// Mapping of option set values to section names
const SECTION_MAP = {
	165590000: 'simple_percent_section',
	165590001: 'pimped_percent_section',
	165590002: 'default_percent_section',
};
