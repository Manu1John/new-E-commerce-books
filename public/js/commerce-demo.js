(function () {
	'use strict';

	var modeGroups = document.querySelectorAll('[data-payment-mode]');

	modeGroups.forEach(function (group) {
		var buttons = group.querySelectorAll('[data-mode]');
		var panel = group.closest('.gateway-panel');
		var panes = panel ? panel.querySelectorAll('[data-pane]') : [];

		buttons.forEach(function (button) {
			button.addEventListener('click', function () {
				var selectedMode = button.getAttribute('data-mode');

				buttons.forEach(function (item) {
					item.classList.toggle('active', item === button);
				});

				panes.forEach(function (pane) {
					pane.classList.toggle('active', pane.getAttribute('data-pane') === selectedMode);
				});
			});
		});
	});

	document.querySelectorAll('[data-mock-pay]').forEach(function (button) {
		button.addEventListener('click', function () {
			var gateway = button.getAttribute('data-mock-pay');
			var panel = button.closest('.gateway-panel');
			var result = panel ? panel.querySelector('[data-payment-result]') : null;

			if (!result) {
				return;
			}

			result.classList.add('active');
			result.innerHTML = '<strong>Payment successful.</strong> ' + gateway +
				' returned transaction id <span>pay_mock_2048</span>.';
		});
	});
}());
