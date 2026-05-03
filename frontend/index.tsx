import { Millennium, IconsModule, definePlugin } from '@steambrew/client';

// export classname class to global context
function windowCreated(context: any) {
	// window create event.
	// you can interact directly with the document and monitor it with dom observers
	// you can then render components in specific pages.
	console.log(context);
}

export default definePlugin(() => {
	Millennium.AddWindowCreateHook(windowCreated);

	return {
		title: 'owoify',
		icon: <IconsModule.Settings />,
	};
});
