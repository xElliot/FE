var hello = (function () { 'use strict';

function create_main_fragment ( root, component ) {
	var h1 = createElement( 'h1' );
	appendNode( createText( "Hello " ), h1 );
	var last_text_1 = root.name;
	var text_1 = createText( last_text_1 );
	appendNode( text_1, h1 );

	return {
		mount: function ( target, anchor ) {
			insertNode( h1, target, anchor );
		},
		
		update: function ( changed, root ) {
			var tmp;
			
			if ( ( tmp = root.name ) !== last_text_1 ) {
				text_1.data = last_text_1 = tmp;
			}
		},
		
		destroy: function ( detach ) {
			if ( detach ) {
				detachNode( h1 );
			}
		}
	};
}

function hello ( options ) {
	options = options || {};
	this._state = options.data || {};
	
	this._observers = {
		pre: Object.create( null ),
		post: Object.create( null )
	};
	
	this._handlers = Object.create( null );
	
	this._root = options._root;
	this._yield = options._yield;
	
	this._torndown = false;
	
	this._fragment = create_main_fragment( this._state, this );
	if ( options.target ) this._fragment.mount( options.target, null );
}

assign( hello.prototype, {
	get: get,
	fire: fire,
	observe: observe,
	on: on,
	set: set,
	_flush: _flush
});

hello.prototype._set = function _set ( newState ) {
	var oldState = this._state;
	this._state = assign( {}, oldState, newState );
	
	dispatchObservers( this, this._observers.pre, newState, oldState );
	if ( this._fragment ) this._fragment.update( newState, this._state );
	dispatchObservers( this, this._observers.post, newState, oldState );
};

hello.prototype.teardown = hello.prototype.destroy = function destroy ( detach ) {
	this.fire( 'destroy' );

	this._fragment.destroy( detach !== false );
	this._fragment = null;

	this._state = {};
	this._torndown = true;
};

function createElement( name ) {
	return document.createElement( name );
}

function insertNode( node, target, anchor ) {
	target.insertBefore( node, anchor );
}

function detachNode( node ) {
	node.parentNode.removeChild( node );
}

function createText( data ) {
	return document.createTextNode( data );
}

function appendNode( node, target ) {
	target.appendChild( node );
}

function assign( target ) {
	for ( var i = 1; i < arguments.length; i += 1 ) {
		var source = arguments[i];
		for ( var k in source ) target[k] = source[k];
	}

	return target;
}

function dispatchObservers( component, group, newState, oldState ) {
	for ( var key in group ) {
		if ( !( key in newState ) ) continue;

		var newValue = newState[ key ];
		var oldValue = oldState[ key ];

		if ( newValue === oldValue && typeof newValue !== 'object' ) continue;

		var callbacks = group[ key ];
		if ( !callbacks ) continue;

		for ( var i = 0; i < callbacks.length; i += 1 ) {
			var callback = callbacks[i];
			if ( callback.__calling ) continue;

			callback.__calling = true;
			callback.call( component, newValue, oldValue );
			callback.__calling = false;
		}
	}
}

function get( key ) {
	return key ? this._state[ key ] : this._state;
}

function fire( eventName, data ) {
	var handlers = eventName in this._handlers && this._handlers[ eventName ].slice();
	if ( !handlers ) return;

	for ( var i = 0; i < handlers.length; i += 1 ) {
		handlers[i].call( this, data );
	}
}

function observe( key, callback, options ) {
	var group = ( options && options.defer ) ? this._observers.post : this._observers.pre;

	( group[ key ] || ( group[ key ] = [] ) ).push( callback );

	if ( !options || options.init !== false ) {
		callback.__calling = true;
		callback.call( this, this._state[ key ] );
		callback.__calling = false;
	}

	return {
		cancel: function () {
			var index = group[ key ].indexOf( callback );
			if ( ~index ) group[ key ].splice( index, 1 );
		}
	};
}

function on( eventName, handler ) {
	if ( eventName === 'teardown' ) return this.on( 'destroy', handler );

	var handlers = this._handlers[ eventName ] || ( this._handlers[ eventName ] = [] );
	handlers.push( handler );

	return {
		cancel: function () {
			var index = handlers.indexOf( handler );
			if ( ~index ) handlers.splice( index, 1 );
		}
	};
}

function set( newState ) {
	this._set( newState );
	( this._root || this )._flush();
}

function _flush() {
	if ( !this._renderHooks ) return;

	while ( this._renderHooks.length ) {
		var hook = this._renderHooks.pop();
		hook.fn.call( hook.context );
	}
}

return hello;

}());